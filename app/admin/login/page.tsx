import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { AdminLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin Login" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await isAuthenticated()) redirect("/admin/dashboard");
  const { next } = await searchParams;
  const target = next?.startsWith("/admin/") && !next.startsWith("/admin/login") ? next : "/admin/dashboard";

  return (
    <div className="container-x nav-offset grid min-h-[60vh] place-items-center">
      <AdminLoginForm next={target} />
    </div>
  );
}
