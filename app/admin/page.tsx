import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppNavbar from "@/components/AppNavbar";
import AdminWorkspace from "./workspace";
export default async function AdminPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (session.user.role !== "ADMIN") redirect("/home");
    if (!session.user) redirect("/login");
    if (session.user.role !== "ADMIN") redirect("/home");
    return <div className="has-shared-nav"><AppNavbar /><AdminWorkspace /></div>;
}
