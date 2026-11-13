import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import DashboardLayout from "../components/DashboardComponent/DashboardLayout";
import { AuthProvider } from "../context/AuthContext";


export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get("token")?.value; // use your real cookie name
  console.log("TOKEN FOUND:", !!token); // shows in the terminal, not the browser

  let role = "";

  let employeeName = "";

  if (token) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      role = String(payload.role ?? "");
    
      console.log("ROLE:", role);
    } catch (e) {
      console.log("JWT ERROR:", e);
    }
  }

  

  return <AuthProvider> <DashboardLayout role={role}>{children}</DashboardLayout></AuthProvider>;
}