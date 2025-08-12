import { redirect } from "next/navigation"
import { createClient } from "@lib/supabase/server"
import { LogIn } from 'lucide-react'
import LoginForm from "./LoginForm"

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    
    redirect(profile?.role === "admin" ? "/admin" : "/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pierakstīties</h1>
          <p className="text-gray-600">Ieejiet savā kontā</p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
