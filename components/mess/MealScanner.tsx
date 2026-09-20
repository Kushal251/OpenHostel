"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";

type Window = { id: string; label: string; startTime: string; endTime: string };
type Step = "idle" | "camera" | "processing" | "select" | "confirm" | "closed" | "no-pass" | "paused" | "done" | "error";

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect(source: ImageBitmapSource): Promise<{ rawValue: string }[]>;
    };
    webkitAudioContext?: typeof AudioContext;
  }
}

export default function MealScanner({ messId, messName }: { messId: string; messName: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [message, setMessage] = useState("");
  const [meal, setMeal] = useState("");
  const [windows, setWindows] = useState<Window[]>([]);
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [receipt, setReceipt] = useState<{ id: string; servedAt: string; userName: string } | null>(null);
  const [passReminder, setPassReminder] = useState<{ expiresAt: string; daysRemaining: number } | null>(null);
  const [refreshingTimings, setRefreshingTimings] = useState(false);
  const [refreshUntil, setRefreshUntil] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const scanLocked = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (!cameraStream || !video.current) return;
    video.current.srcObject = cameraStream;
    void video.current.play().catch(() => undefined);
  }, [cameraStream]);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(`openhostel:scanner-window-refresh:${messId}`));
    if (stored > Date.now()) setRefreshUntil(stored);
    const timer = window.setInterval(() => setClock(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [messId]);

  useEffect(() => {
    if (step !== "done") return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const tone = (frequency: number, start: number) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.15, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.2);
    };
    tone(880, context.currentTime);
    tone(1320, context.currentTime + 0.16);
    return () => void context.close();
  }, [step]);

  const stopCamera = () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setCameraStream(null);
  };
  const close = () => {
    stopCamera();
    scanLocked.current = false;
    setOpen(false);
    setStep("idle");
    setMessage("");
    setSelectedWindowId(null);
    setPassReminder(null);
  };

  async function start() {
    stopCamera();
    scanLocked.current = false;
    setMessage("");
    setSelectedWindowId(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(window.isSecureContext ? "This browser does not support camera scanning. Use the latest Chrome or Safari." : "Camera access on a phone requires the HTTPS version of this site.");
      setStep("error");
      return;
    }
    if (!window.BarcodeDetector) {
      setMessage("Automatic QR scanning needs the latest Chrome or Safari on this device.");
      setStep("error");
      return;
    }
    setStep("camera");
    try {
      const activeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      stream.current = activeStream;
      setCameraStream(activeStream);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setMessage(name === "NotAllowedError" ? "Camera permission was blocked. Allow Camera for this site in browser settings, then try again." : name === "NotReadableError" ? "Your camera is being used by another app. Close it and try again." : "Camera access is required to scan the mess QR.");
      setStep("error");
    }
  }

  async function submit(confirm = false, windowId = selectedWindowId) {
    try {
      const response = await fetch("/api/meal-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messId, qr: `openhostel://mess/${messId}`, confirm, mealWindowId: windowId }),
      });
      const data = await response.json();
      if (!response.ok && !["NO_PASS", "PAUSED"].includes(data.state)) throw new Error(data.error || "Could not complete check-in.");
      if (data.state === "NO_PASS") { setStep("no-pass"); return; }
      if (data.state === "PAUSED") {
        const until = new Date(data.pauseEndsAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
        setMessage(`Your pass is paused until ${until}. Scanning will resume automatically in ${data.remainingDays} day${data.remainingDays === 1 ? "" : "s"}.`);
        setStep("paused");
        return;
      }
      if (data.state === "CLOSED") {
        setMessage(data.next ? `${data.next.label} starts in ${data.minutesUntilNext} min (${data.next.startTime}).` : "No more serving windows are scheduled today.");
        setStep("closed");
        return;
      }
      if (data.state === "SELECT_WINDOW") { setWindows(data.windows); setStep("select"); return; }
      if (data.state === "CONFIRM") { setMeal(data.window.label); setStep("confirm"); return; }
      if (data.state === "DONE") {
        setMeal(data.transaction.mealWindow.label);
        setReceipt({ id: data.transaction.id, servedAt: data.transaction.servedAt, userName: data.userName || "Student" });
        setPassReminder(data.passReminder || null);
        setStep("done");
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not complete check-in.");
      setStep("error");
    }
  }

  async function refreshWindowTimings() {
    if (refreshUntil > Date.now()) return;
    setRefreshingTimings(true);
    try {
      const response = await fetch("/api/meal-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messId, refreshWindows: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not refresh meal timings.");
      const until = Date.now() + 5 * 60_000;
      window.localStorage.setItem(`openhostel:scanner-window-refresh:${messId}`, String(until));
      setRefreshUntil(until);
      setMessage("Latest meal timings have been loaded. Scan the QR again to check the updated window.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not refresh meal timings.");
    } finally {
      setRefreshingTimings(false);
    }
  }

  useEffect(() => {
    if (step !== "camera" || !cameraStream || !video.current || !window.BarcodeDetector) return;
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    let checking = false;
    const detect = async () => {
      if (checking || scanLocked.current || !video.current || video.current.readyState < 2) return;
      checking = true;
      try {
        const result = await detector.detect(video.current);
        const value = result[0]?.rawValue;
        if (!value) return;
        if (value !== `openhostel://mess/${messId}`) {
          setMessage("This QR code is not for this mess. Please scan the official mess QR.");
          return;
        }
        scanLocked.current = true;
        stopCamera();
        setMessage("");
        setStep("processing");
        await submit();
      } catch {
        // A partly visible QR can throw while the camera focuses; keep scanning.
      } finally {
        checking = false;
      }
    };
    void detect();
    const timer = window.setInterval(() => void detect(), 450);
    return () => window.clearInterval(timer);
  }, [cameraStream, step, messId]);

  return <>
    <button onClick={() => { setOpen(true); void start(); }} className="fixed bottom-5 right-5 z-30 inline-flex min-h-14 items-center gap-2 rounded-full bg-[#d63a36] px-5 font-bold text-white shadow-[0_12px_30px_rgba(214,58,54,.35)] sm:bottom-7 sm:right-7" aria-label="Scan mess QR"><span className="text-xl">▣</span> Scan mess QR</button>
    <Modal open={open && step !== "done"} title="Scan mess QR" onClose={close}>
      {step === "camera" && <CameraView videoRef={video} message={message} messName={messName} />}
      {step === "processing" && <LoadingView />}
      {step === "select" && <MealChoice windows={windows} onPick={(window) => { setSelectedWindowId(window.id); setStep("processing"); void submit(false, window.id); }} />}
      {step === "confirm" && <ConfirmMeal meal={meal} onConfirm={() => { setStep("processing"); void submit(true); }} onClose={close} />}
      {step === "no-pass" && <Notice icon="🎫" title="No active mess pass" text="Buy a pass for this mess before checking in." primary="View mess passes" onPrimary={() => router.push(`/mess/${messId}`)} secondary="Back to home" onSecondary={() => router.push("/home")} />}
      {step === "paused" && <Notice icon="⏸️" title="Mess pass is paused" text={message} primary="Okay" onPrimary={close} />}
      {step === "closed" && <ClosedNotice text={message} refreshing={refreshingTimings} refreshRemaining={Math.max(0, refreshUntil - clock)} onRefresh={() => void refreshWindowTimings()} onScanAgain={() => void start()} onClose={close} />}
      {step === "error" && <Notice icon="!" title="Unable to scan" text={message} primary="Try again" onPrimary={() => void start()} secondary="Close" onSecondary={close} />}
    </Modal>
    {open && step === "done" && <SuccessScreen meal={meal} messName={messName} receipt={receipt} passReminder={passReminder} onHistory={() => router.push("/history")} onClose={close} />}
  </>;
}

function CameraView({ videoRef, message, messName }: { videoRef: RefObject<HTMLVideoElement | null>; message: string; messName: string }) {
  return <>
    <div className="relative overflow-hidden rounded-2xl bg-slate-950">
      <video ref={videoRef} muted playsInline className="aspect-square w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="relative h-52 w-52 overflow-hidden rounded-2xl border-2 border-white shadow-[0_0_0_999px_rgba(0,0,0,.28)]">
          <div className="absolute inset-x-0 top-0 h-0.5 animate-bounce bg-[#f4c86a] shadow-[0_0_14px_3px_#f4c86a]" />
        </div>
      </div>
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white">Scanning automatically…</p>
    </div>
    <p className="mt-4 text-center text-sm font-semibold text-slate-600">Keep the official {messName} QR inside the frame.</p>
    {message && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{message}</p>}
  </>;
}

function LoadingView() { return <div className="py-10 text-center"><div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-[#e8f1f0] border-t-[#d63a36]" /><h3 className="mt-6 text-xl font-bold">Processing your check-in</h3><p className="mt-2 text-sm text-slate-600">Please wait a moment…</p></div>; }

function MealChoice({ windows, onPick }: { windows: Window[]; onPick: (window: Window) => void }) { return <div className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-3xl">🍽️</div><h3 className="mt-4 text-xl font-bold">Meals are available now</h3><p className="mt-2 text-sm text-slate-600">Which meal are you checking in for?</p><div className="mt-5 space-y-3">{windows.map(window => <button key={window.id} onClick={() => onPick(window)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-[#d63a36]"><span className="font-bold text-slate-900">{window.label}</span><span className="text-sm font-semibold text-slate-500">{window.startTime} – {window.endTime}</span></button>)}</div></div>; }

function ConfirmMeal({ meal, onConfirm, onClose }: { meal: string; onConfirm: () => void; onClose: () => void }) { return <div className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl">🍽️</div><h3 className="mt-4 text-xl font-bold">{meal} is serving now</h3><p className="mt-2 text-sm leading-6 text-slate-600">Confirm that you are taking this meal.</p><button onClick={onConfirm} className="btn-primary mt-5 w-full">Yes, confirm my meal</button><button onClick={onClose} className="mt-3 w-full py-3 text-sm font-bold text-slate-600">Not yet</button></div>; }

function ClosedNotice({ text, refreshing, refreshRemaining, onRefresh, onScanAgain, onClose }: { text: string; refreshing: boolean; refreshRemaining: number; onRefresh: () => void; onScanAgain: () => void; onClose: () => void }) {
  const refreshLabel = refreshRemaining ? `Refresh timings (${Math.ceil(refreshRemaining / 60)}m)` : "Refresh meal timings";
  return <div className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f8e2dc] text-3xl">🕒</div><h3 className="mt-4 text-xl font-bold">No serving window is open</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p><button disabled={refreshing || refreshRemaining > 0} onClick={onRefresh} className="mt-5 min-h-11 w-full rounded-xl bg-slate-100 px-4 text-sm font-bold text-[#234b50] disabled:opacity-50">{refreshing ? "↻ Refreshing timings…" : `↻ ${refreshLabel}`}</button><button onClick={onScanAgain} className="btn-primary mt-3 w-full">Scan again</button><button onClick={onClose} className="mt-2 w-full py-3 text-sm font-bold text-slate-600">Close</button></div>;
}

function SuccessScreen({ meal, messName, receipt, passReminder, onHistory, onClose }: { meal: string; messName: string; receipt: { id: string; servedAt: string; userName: string } | null; passReminder: { expiresAt: string; daysRemaining: number } | null; onHistory: () => void; onClose: () => void }) { const expiry = passReminder && new Date(passReminder.expiresAt).toLocaleDateString("en-IN", { dateStyle: "medium" }); return <section className="fixed inset-0 z-[100] grid min-h-screen place-items-center overflow-y-auto bg-gradient-to-br from-[#0d2d32] via-[#234b50] to-[#39727a] p-5 text-center text-white"><div className="w-full max-w-lg animate-[pulse_1.6s_ease-in-out_infinite] rounded-[2rem] border border-white/20 bg-white/10 p-7 shadow-2xl backdrop-blur sm:p-10"><div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald-400 text-5xl text-emerald-950 shadow-[0_0_0_12px_rgba(52,211,153,.16)]">✓</div><p className="mt-8 text-xs font-bold uppercase tracking-[.22em] text-[#f4c86a]">Transaction successful</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{receipt?.userName}</h1><p className="mt-3 text-xl font-bold text-emerald-100">{meal} recorded</p><p className="mt-4 text-sm text-emerald-50">{messName} · {receipt && new Date(receipt.servedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p><p className="mt-4 text-xs text-emerald-100">Receipt #{receipt?.id}</p>{passReminder && <div className="mt-6 rounded-2xl border border-amber-200/60 bg-amber-50 p-4 text-left text-amber-950"><p className="text-xs font-black uppercase tracking-[.16em] text-amber-700">Pass renewal reminder</p><p className="mt-2 text-sm font-semibold leading-6">Your mess pass is valid until {expiry}. {passReminder.daysRemaining === 0 ? "From tomorrow, you will not be able to scan or receive meals." : `You have ${passReminder.daysRemaining} day${passReminder.daysRemaining === 1 ? "" : "s"} left before it expires.`} Please make your payment to renew your pass and avoid interruption to your meals.</p></div>}<div className="mt-8 grid gap-3 sm:grid-cols-2"><button onClick={onHistory} className="min-h-12 rounded-xl bg-white px-4 font-bold text-[#234b50]">View meal history</button><button onClick={onClose} className="min-h-12 rounded-xl border border-white/40 px-4 font-bold text-white">Done</button></div></div></section>; }

function Notice({ icon, title, text, primary, onPrimary, secondary, onSecondary }: { icon: string; title: string; text: string; primary: string; onPrimary: () => void; secondary?: string; onSecondary?: () => void }) { return <div className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f8e2dc] text-3xl">{icon}</div><h3 className="mt-4 text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p><button onClick={onPrimary} className="btn-primary mt-5 w-full">{primary}</button>{secondary && <button onClick={onSecondary} className="mt-2 w-full py-3 text-sm font-bold text-slate-600">{secondary}</button>}</div>; }
