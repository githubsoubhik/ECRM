// "use client";

// // Empty string = same origin ("/api/..." goes through the Next.js proxy, see step 2).
// // Use ?? not ||, because "" is falsy and || would fall back to the IP address.
// const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// export async function fetchWithAuth(endpoint, options = {}) {
//   const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

//   // Let the browser set Content-Type for file uploads (FormData)
//   const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;

//   const headers = {
//     ...(isForm ? {} : { "Content-Type": "application/json" }),
//     ...(options.headers || {}),
//   };

//   try {
//     const response = await fetch(`${BASE}${path}`, {
//       ...options,
//       headers,
//       credentials: "include",   // sends the httpOnly login cookie
//       cache: "no-store",
//     });

//     // Token expired or removed while the user was on a page
//     if (
//       response.status === 401 &&
//       typeof window !== "undefined" &&
//       !path.includes("/auth/login") &&
//       !window.location.pathname.startsWith("/login")
//     ) {
//       window.location.href = "/login";
//       return new Promise(() => {});   // stop any code waiting for this response
//     }

//     return response;                  // callers still do response.json() as before
//   } catch (error) {
//     console.error("fetchWithAuth error:", error);
//     throw error;
//   }
// }



"use client";

// Empty string = same origin, so "/api/..." goes through the Next.js proxy
// (rewrites in next.config.ts) and the httpOnly cookie is sent.
// Leave NEXT_PUBLIC_API_URL empty in .env.local.
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

const isAbsolute = (url) => /^https?:\/\//i.test(url);

export async function fetchWithAuth(endpoint, options = {}) {
  // Full URLs are used as-is, relative ones get a leading "/"
  let url;
  let path;
  if (isAbsolute(endpoint)) {
    url = endpoint;
    path = new URL(endpoint).pathname;
  } else {
    path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    url = `${BASE}${path}`;
  }

  const isForm =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  // Works with plain objects and Headers instances
  const headers = new Headers(options.headers || {});

  if (isForm) {
    // Browser must set the multipart boundary itself
    headers.delete("Content-Type");
  } else if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // sends the httpOnly login cookie
      cache: "no-store",
    });

    const onLoginPage =
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/login");

    // Token expired or removed while the user was on a page
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !onLoginPage &&
      !path.includes("/auth/login")
    ) {
      window.location.href = "/login";
      return new Promise(() => {}); // stop code waiting for this response
    }

    if (response.status === 403) {
      console.warn("Forbidden (role not allowed):", path);
    }

    return response; // callers still do response.json()
  } catch (error) {
    console.error("fetchWithAuth error:", error);
    throw error;
  }
}