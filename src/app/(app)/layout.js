import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function PrivateLayout({ children }) {
  const token = (await cookies()).get("token")?.value;
  let ok = false;

  if (token) {
    try {
      const res = await fetch(`${process.env.API_URL}/auth/me`, {
        headers: { Cookie: `token=${token}` },
        cache: "no-store",
      });
      ok = res.ok;
    } catch {}
  }

  if (!ok) redirect("/login");
  return <>{children}</>;
}