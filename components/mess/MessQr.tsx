"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Modal } from "@/components/Modal";

export default function MessQr({
  messId,
  messName,
}: {
  messId: string;
  messName: string;
}) {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState("");
  useEffect(() => {
    void QRCode.toDataURL(`openhostel://mess/${messId}`, {
      width: 720,
      margin: 2,
      errorCorrectionLevel: "H",
    }).then(setSrc);
  }, [open, messId]);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl bg-white p-1.5 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        aria-label={`View full-screen QR for ${messName}`}
      >
        <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-white">
          {src ? (
            <img src={src} alt="" className="h-full w-full" />
          ) : (
            <span className="text-xs text-slate-400">QR</span>
          )}
        </div>
        <span className="pr-2">
          <span className="block text-sm font-bold text-[#234b50]">
            Mess QR
          </span>
          <span className="block text-[11px] font-semibold text-slate-500">
            Tap to expand
          </span>
        </span>
      </button>
      <Modal
        open={open}
        title={`${messName} QR`}
        onClose={() => setOpen(false)}
      >
        <div className="text-center">
          <div className="mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-white p-3 shadow-inner ring-1 ring-slate-200">
            {src ? (
              <img
                src={src}
                alt={`Scan this QR to check in at ${messName}`}
                className="h-full w-full"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-500">
                Creating QR…
              </div>
            )}
          </div>
          <p className="mt-5 font-bold text-slate-900">
            Scan at the mess entrance
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Tap outside or × to close the full-screen QR.
          </p>
        </div>
      </Modal>
    </>
  );
}
