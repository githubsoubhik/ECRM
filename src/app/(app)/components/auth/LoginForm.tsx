// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import toast from "react-hot-toast";
// import { Mail, Lock, Eye, EyeOff, Fingerprint, ArrowRight } from "lucide-react";
// import { fetchWithAuth } from "../../../../lib/fetchWithAuth";

// export default function LoginForm() {
//   const router = useRouter();
//   const [showPassword, setShowPassword] = useState(false);
//   const [isBiometricLoading, setIsBiometricLoading] = useState(false);

//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     toast.success("Login successful!");

//     setTimeout(() => {
//       router.push("/dashboard");
//     }, 2000);
//   };

//   // WebAuthn Biometric Authentication Handler
//   const handleBiometricLogin = async () => {
//     if (!window.PublicKeyCredential) {
//       toast.error("Biometric authentication is not supported on this device/browser.");
//       return;
//     }

//     try {

//       const loginfetch = await fetchWithAuth('/api/auth/login');

//       if(!loginfetch){
//         console.log("error  to  login ")
//       }
//       setIsBiometricLoading(true);
      
//       // Placeholder for your backend challenge/verification flow
//       toast.loading("Scanning biometrics...", { id: "biometric-toast" });

//       // Simulate biometric check delay
//       setTimeout(() => {
//         toast.success("Biometric verification successful!", { id: "biometric-toast" });
//         router.push("/dashboard");
//       }, 2000);
//     } catch (error) {
//       toast.error("Biometric authentication failed. Please try again.", { id: "biometric-toast" });
//     } finally {
//       setIsBiometricLoading(false);
//     }
//   };

//   return (
//     <>
//       <h2 className="form-title">
//         Employee <span>Login</span>
//       </h2>
//       <p className="form-subtitle">
//         Access your workspace and stay connected with your team.
//       </p>

//       <form onSubmit={handleSubmit} className="auth-form">
//         {/* Email / Employee ID Field */}
//         <div className="input-group">
//           <Mail className="input-icon" size={18} />
//           <input
//             type="text"
//             placeholder="Employee ID or Email"
//             className="auth-input"
//             required
//           />
//         </div>

//         {/* Password Field with Hide/Show Toggle */}
//         <div className="input-group">
//           <Lock className="input-icon" size={18} />
//           <input
//             type={showPassword ? "text" : "password"}
//             placeholder="Password"
//             className="auth-input"
//             required
//           />
//           <button
//             type="button"
//             className="eye-btn"
//             onClick={() => setShowPassword((prev) => !prev)}
//             aria-label={showPassword ? "Hide password" : "Show password"}
//           >
//             {showPassword ? (
//               <EyeOff size={18} className="eye-icon" />
//             ) : (
//               <Eye size={18} className="eye-icon" />
//             )}
//           </button>
//         </div>

//         <div className="forgot-password">
//           <Link href="/forgot-password">Forgot Password?</Link>
//         </div>

//         <button type="submit" className="auth-button">
//           <span>Login</span>
//           <ArrowRight size={18} />
//         </button>

//         <div className="or-divider">
//           <span>OR</span>
//         </div>

//         {/* Updated Biometric Login Button */}
//         <button
//           type="button"
//           onClick={handleBiometricLogin}
//           disabled={isBiometricLoading}
//           className="biometric-btn"
//         >
//           <div className="biometric-icon-badge">
//             <Fingerprint size={28} className="biometric-fingerprint" />
//           </div>
//           <span>
//             {isBiometricLoading ? "Authenticating..." : "Login with Biometrics"}
//           </span>
//         </button>

//         <p className="auth-switch">
//           Not an employee?{" "}
//           <Link href="/signup" className="auth-link">
//             SignUp
//           </Link>
//         </p>
//       </form>
//     </>
//   );
// }


"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, Fingerprint, ArrowRight } from "lucide-react";
import { fetchWithAuth } from "../../../../../lib/fetchWithAuth";

export default function LoginForm() {
  const router = useRouter();

  // Form input state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  // Standard Credentials Login Handler
  // const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();

  //   if (!identifier.trim() || !password.trim()) {
  //     toast.error("Please enter both your ID/Email and password.");
  //     return;
  //   }

  //   setLoading(true);
  //   const toastId = toast.loading("Verifying credentials...");

  //   try {
  //     // POST to /api/auth/login with credentials
  //     const res = await fetchWithAuth("/api/auth/login", {
  //       method: "POST",
  //       body: JSON.stringify({
  //         identifier: identifier.trim(),
  //         password: password.trim(),
  //       }),
  //     });

  //     const result = await res.json();

  //     if (!res.ok || !result.success) {
  //       throw new Error(result.message || "Invalid credentials.");
  //     }

  //     // Store JWT token and user info for authenticated sessions
  //     if (typeof window !== "undefined") {
  //       localStorage.setItem("token", result.token);
  //       localStorage.setItem("user", JSON.stringify(result.data));
  //     }

  //     toast.success(result.message || "Login successful!", { id: toastId });

  //     // Navigate to protected dashboard
  //     setTimeout(() => {
  //       router.push("/dashboard");
  //     }, 1000);
  //   } catch (error: any) {
  //     console.error("Login Error:", error);
  //     toast.error(error.message || "Failed to log in. Please try again.", {
  //       id: toastId,
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!identifier.trim() || !password) {
    toast.error("Please enter both your ID/Email and password.");
    return;
  }

  setLoading(true);
  const toastId = toast.loading("Verifying credentials...");

  try {
    const res = await fetchWithAuth("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: identifier.trim(),
        password,                      // no trim: the backend compares it exactly
      }),
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok || !result.success) {
      throw new Error(result.message || "Invalid credentials.");
    }

    // The JWT is now in an httpOnly cookie set by the server.
    // Do NOT store it in localStorage.

    toast.success(result.message || "Login successful!", { id: toastId });

    // Go back to the page the user first asked for (internal paths only)
    const next = new URLSearchParams(window.location.search).get("next");
    const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

    router.replace(safe);
    router.refresh();
  } catch (error: any) {
    toast.error(error.message || "Failed to log in. Please try again.", { id: toastId });
  } finally {
    setLoading(false);
  }
};

  // WebAuthn Biometric Authentication Handler
  const handleBiometricLogin = async () => {
    if (!window.PublicKeyCredential) {
      toast.error("Biometric authentication is not supported on this device/browser.");
      return;
    }

    setIsBiometricLoading(true);
    const biometricToastId = toast.loading("Scanning biometrics...");

    try {
      // Example call to biometric verification endpoint when configured
      toast.success("Biometric verification successful!", { id: biometricToastId });
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      toast.error("Biometric authentication failed. Please try again.", {
        id: biometricToastId,
      });
    } finally {
      setIsBiometricLoading(false);
    }
  };

  return (
    <>
      <h2 className="form-title">
        Employee <span>Login</span>
      </h2>
      <p className="form-subtitle">
        Access your workspace and stay connected with your team.
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        {/* Email / Employee ID / Phone Field */}
        <div className="input-group">
          <Mail className="input-icon" size={18} />
          <input
            type="text"
            placeholder="Employee ID, Email, or Phone"
            className="auth-input"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={loading}
            required
            autoComplete="username"
          />
        </div>

        {/* Password Field with Hide/Show Toggle */}
        <div className="input-group">
          <Lock className="input-icon" size={18} />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            className="eye-btn"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff size={18} className="eye-icon" />
            ) : (
              <Eye size={18} className="eye-icon" />
            )}
          </button>
        </div>

        <div className="forgot-password">
          <Link href="/forgot-password">Forgot Password?</Link>
        </div>

        <button type="submit" className="auth-button" disabled={loading}>
          <span>{loading ? "Authenticating..." : "Login"}</span>
          <ArrowRight size={18} />
        </button>

        <div className="or-divider">
          <span>OR</span>
        </div>

        {/* Biometric Login Button */}
        <button
          type="button"
          onClick={handleBiometricLogin}
          disabled={isBiometricLoading || loading}
          className="biometric-btn"
        >
          <div className="biometric-icon-badge">
            <Fingerprint size={28} className="biometric-fingerprint" />
          </div>
          <span>
            {isBiometricLoading ? "Authenticating..." : "Login with Biometrics"}
          </span>
        </button>

        <p className="auth-switch">
          Not an employee?{" "}
          <Link href="/signup" className="auth-link">
            SignUp
          </Link>
        </p>
      </form>
    </>
  );
}