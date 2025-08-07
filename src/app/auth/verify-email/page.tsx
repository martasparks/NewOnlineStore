'use client'

import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLoading } from '@hooks/useLoading';
import { Loading } from '@/components/ui/Loading';

export default function VerifyEmailPage() {
  const { isLoading } = useLoading(true);
  if (isLoading) {
    return <Loading fullScreen variant="spinner" text="Lūdzu, uzgaidiet. Ielādējam..." />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Pārbaudiet savu e-pastu
        </h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          Mēs nosūtījām apstiprinājuma saiti uz jūsu e-pasta adresi. 
          Lūdzu, pārbaudiet savu iesūtni un noklikšķiniet uz saites, 
          lai aktivizētu savu kontu.
        </p>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
            <strong>Padoms:</strong> Ja neredzat e-pastu, pārbaudiet spam/mēstuļu mapi.
          </div>
          
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Atpakaļ uz pierakstīšanos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}