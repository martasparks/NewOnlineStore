"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, LogIn, Mail, Lock } from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || "";

export default function LoginForm() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithFacebook, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!captchaToken) {
      setLoginError("Lūdzu, apstipriniet, ka neesat robots.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password, captchaToken);
      router.replace("/admin");
    } catch (err: any) {
      setLoginError(err?.message || "Neizdevās pieteikties. Mēģiniet vēlreiz.");
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
      setCaptchaToken(null);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setSocialLoading(true);
    setLoginError(null);
    try {
      await signInWithGoogle();
      router.replace("/admin");
    } catch (err: any) {
      setLoginError(err?.message || "Neizdevās pieteikties ar Google.");
    }
    setSocialLoading(false);
  };

  const handleFacebookLogin = async () => {
    setSocialLoading(true);
    setLoginError(null);
    try {
      await signInWithFacebook();
      router.replace("/admin");
    } catch (err: any) {
      setLoginError(err?.message || "Neizdevās pieteikties ar Facebook.");
    }
    setSocialLoading(false);
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setLoginError(null);
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
  };

  return (
    <form className="space-y-6 w-full max-w-md mx-auto" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2"
          disabled={socialLoading}
          onClick={handleGoogleLogin}
        >
          <svg className="h-5 w-5" viewBox="0 0 48 48">
            <g>
              <path
                fill="#4285F4"
                d="M44.5 20H24v8.5h11.8C34.7 33.2 30.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 2.9l6.1-6.1C34.5 6.5 29.6 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5c10.5 0 19.5-8.5 19.5-19.5 0-1.3-.1-2.5-.3-3.5z"
              />
              <path
                fill="#34A853"
                d="M6.3 14.1l7 5.1C15.9 16.5 19.7 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.1-6.1C34.5 6.5 29.6 4.5 24 4.5c-7.1 0-13.1 4.1-16.1 10.1z"
              />
              <path
                fill="#FBBC05"
                d="M24 45.5c5.5 0 10.4-2 14.2-5.5l-6.6-5.4c-2 1.5-4.5 2.4-7.6 2.4-6.2 0-11.4-4.2-13.3-9.8l-7 5.4C7 41.2 14.9 45.5 24 45.5z"
              />
              <path
                fill="#EA4335"
                d="M44.5 20H24v8.5h11.8c-1.2 3.2-4.2 5.5-7.8 5.5-4.7 0-8.6-3.8-8.6-8.5s3.9-8.5 8.6-8.5c2.1 0 4 .7 5.5 2.1l6.2-6.1C34.5 6.5 29.6 4.5 24 4.5c-7.1 0-13.1 4.1-16.1 10.1z"
              />
            </g>
          </svg>
          Turpināt ar Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2"
          disabled={socialLoading}
          onClick={handleFacebookLogin}
        >
          <svg className="h-5 w-5" viewBox="0 0 32 32">
            <path
              d="M29 0H3C1.3 0 0 1.3 0 3v26c0 1.7 1.3 3 3 3h13V20h-4v-5h4v-3.7C16 7.8 18.4 6 21.7 6c1.2 0 2.3.1 2.6.1v4h-1.8c-1.4 0-1.7.7-1.7 1.7V15h4.5l-.6 5H21v12h8c1.7 0 3-1.3 3-3V3c0-1.7-1.3-3-3-3z"
              fill="#1877F3"
            />
            <path
              d="M21 32V20h3.6l.6-5H21v-3.3c0-1 .3-1.7 1.7-1.7h1.8v-4c-.3 0-1.4-.1-2.6-.1-3.3 0-5.7 1.8-5.7 5.1V15h-4v5h4v12h4z"
              fill="#fff"
            />
          </svg>
          Turpināt ar Facebook
        </Button>
      </div>
      <div className="relative">
        <span className="absolute inset-x-0 top-1/2 border-t border-gray-300" />
        <span className="relative flex justify-center text-xs uppercase bg-white px-2 text-gray-500 -mt-3">
          vai
        </span>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">E-pasts</label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="email"
            className="pl-10 pr-3 py-2 border border-gray-300 rounded w-full focus:outline-none focus:border-primary"
            placeholder="E-pasta adrese"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Parole</label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            className="pl-10 pr-10 py-2 border border-gray-300 rounded w-full focus:outline-none focus:border-primary"
            placeholder="Parole"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-2.5"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Slēpt paroli" : "Rādīt paroli"}
          >
            {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
          </button>
        </div>
      </div>
      <div className="flex justify-end">
        <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
          Aizmirsi paroli?
        </Link>
      </div>
      <div className="flex justify-center">
        <HCaptcha
          sitekey={SITE_KEY}
          onVerify={handleCaptchaVerify}
          onExpire={handleCaptchaExpire}
          ref={captchaRef}
        />
      </div>
      {loginError && (
        <div className="text-red-600 text-sm text-center">{loginError}</div>
      )}
      <Button
        type="submit"
        className="w-full flex items-center justify-center gap-2"
        disabled={loading}
      >
        {loading ? <Loading className="animate-spin h-5 w-5" /> : <LogIn className="h-5 w-5" />}
        Pieteikties
      </Button>
      <div className="text-center text-sm">
        Vai vēl neesi reģistrējies?{" "}
        <Link href="/auth/register" className="text-primary hover:underline">
          Izveidot kontu
        </Link>
      </div>
    </form>
  );
}