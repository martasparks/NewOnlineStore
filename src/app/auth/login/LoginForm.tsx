"use client"

import React, { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { Loading } from "@/components/ui/Loading"
import HCaptcha from "@hcaptcha/react-hcaptcha"

const SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ""

export default function LoginForm() {
  const router = useRouter()
  const { signIn, signInWithGoogle, signInWithFacebook, error } = useAuth()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    
    if (!captchaToken) {
      setLoginError("Lūdzu, apstipriniet, ka neesat robots.")
      return
    }
    
    setLoading(true)
    try {
      const result = await signIn(email, password, captchaToken)
      if (!result.error) {
        router.replace("/admin")
      } else {
        setLoginError(result.error)
        if (captchaRef.current) {
          captchaRef.current.resetCaptcha()
        }
        setCaptchaToken(null)
      }
    } catch (err: any) {
      setLoginError(err?.message || "Neizdevās pieteikties. Mēģiniet vēlreiz.")
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha()
      }
      setCaptchaToken(null)
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setSocialLoading(true)
    setLoginError(null)
    try {
      const result = await signInWithGoogle()
      if (!result.error) {
        router.replace("/admin")
      } else {
        setLoginError(result.error)
      }
    } catch (err: any) {
      setLoginError(err?.message || "Neizdevās pieteikties ar Google.")
    }
    setSocialLoading(false)
  }

  const handleFacebookLogin = async () => {
    setSocialLoading(true)
    setLoginError(null)
    try {
      const result = await signInWithFacebook()
      if (!result.error) {
        router.replace("/admin")
      } else {
        setLoginError(result.error)
      }
    } catch (err: any) {
      setLoginError(err?.message || "Neizdevās pieteikties ar Facebook.")
    }
    setSocialLoading(false)
  }

  return (
    <>
      {/* Social Login Buttons */}
      <div className="space-y-3 mb-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={loading || socialLoading}
          className="w-full"
        >
          {socialLoading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Turpināt ar Google
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={handleFacebookLogin}
          disabled={loading || socialLoading}
          className="w-full"
        >
          {socialLoading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <svg className="w-4 h-4 mr-2" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          )}
          Turpināt ar Facebook
        </Button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">vai</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            E-pasta adrese
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="jusu@epasts.lv"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Parole
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? "Slēpt paroli" : "Rādīt paroli"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
            Aizmirsi paroli?
          </Link>
        </div>

        {/* hCaptcha */}
        <div className="flex justify-center">
          <HCaptcha
            sitekey={SITE_KEY}
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
            ref={captchaRef}
          />
        </div>

        {/* Error Message */}
        {(loginError || error) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {loginError || error}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || socialLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Pieslēdzamies..
            </>
          ) : (
            "Pieteikties"
          )}
        </Button>

        {/* Register Link */}
        <div className="text-center text-sm text-gray-600">
          Vai vēl neesi reģistrējies?{" "}
          <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Izveidot kontu
          </Link>
        </div>
      </form>
    </>
  )
}