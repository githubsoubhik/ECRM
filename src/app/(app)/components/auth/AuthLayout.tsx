import React from "react";
import Image from "next/image";

interface Props {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="login-container">
      {/* Left Column: Background Image & Branding Info */}
      <div className="login-left">
        <div className="bg-image-wrapper">
          <Image
            src="/login_bg.jpg" // Place your background image in /public/login_bg.jpg
            alt="Workspace background"
            fill
            priority
            style={{ objectFit: "cover" }}
          />
        </div>

        <div className="left-overlay">
          <div className="brand-logo">
            <Image
              src="/logo (2).png" // Place your logo in /public/logo.png
              alt="Nexora Digital Solutions"
              width={180}
              height={40}
              priority
            />
          </div>

          <div className="left-content">
            <h1 className="welcome-title">Welcome Back!</h1>
            <p className="welcome-subtitle">lets build something amazing together.</p>
            <div className="yellow-divider"></div>

            <ul className="feature-list">
              <li>
                <div className="icon-box">👥</div>
                <div>
                  <strong>Collaborate</strong>
                  <p>Work together. Grow together.</p>
                </div>
              </li>
              <li>
                <div className="icon-box">📋</div>
                <div>
                  <strong>Manage Tasks</strong>
                  <p>Stay organized. Meet deadlines.</p>
                </div>
              </li>
              <li>
                <div className="icon-box">📊</div>
                <div>
                  <strong>Track Progress</strong>
                  <p>Achieve more, every day.</p>
                </div>
              </li>
              <li>
                <div className="icon-box">⭐</div>
                <div>
                  <strong>Be Part of Something Bigger</strong>
                  <p>Your work makes an impact.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="left-footer">People | Projects | Growth</div>
        </div>
      </div>

      {/* Right Column: Injected Form Page ({children}) */}
      <div className="login-right">
        <div className="card-wrapper">{children}</div>
      </div>
    </div>
  );
}