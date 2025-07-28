'use client'

import Link from 'next/link'
import { Shield, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export default function UnauthorizedPage() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
          <Shield className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Nav piekļuves tiesību
        </h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          Jums nav nepieciešamo tiesību, lai piekļūtu šai lapai. 
          Tikai administratori var piekļūt admin panelim.
        </p>
        
        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <Home className="w-4 h-4 mr-2" />
              Uz sākumlapu
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}