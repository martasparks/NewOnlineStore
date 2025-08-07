'use client'

'use client'

import { useLoading } from '@hooks/useLoading';
import { Loading } from '@/components/ui/Loading';
import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  const { isLoading } = useLoading(true);
  if (isLoading) {
    return <Loading fullScreen variant="spinner" text="Lūdzu, uzgaidiet. Ielādējam..." />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Autentifikācijas kļūda
        </h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          Diemžēl radās kļūda autentifikācijas procesā. 
          Lūdzu, mēģiniet vēlreiz vai sazinieties ar atbalsta dienestu.
        </p>
        
        <div className="space-y-3">
          <Link href="/auth/login">
            <Button className="w-full bg-red-600 hover:bg-red-700">
              Mēģināt vēlreiz
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Uz sākumlapu
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}