'use client'

import Link from 'next/link'
import { Shield, Home, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {

 return (
   <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4 relative overflow-hidden">
     
     <div className="absolute inset-0 overflow-hidden">
       <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-200/30 rounded-full blur-3xl"></div>
       <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl"></div>
       <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl"></div>
     </div>

     <div className="relative z-10 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 w-full max-w-lg p-10 text-center">
       
       <div className="relative mb-8">
         <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mb-6 shadow-lg animate-pulse">
           <Shield className="w-12 h-12 text-white drop-shadow-lg" />
         </div>

       </div>

       <div className="space-y-6">
         <div>
           <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-3">
             Piekļuve liegta
           </h1>
           
           <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mx-auto mb-4"></div>
           
           <p className="text-gray-600 text-lg leading-relaxed">
             Jums nav administratora tiesību šai lapai.
           </p>
           <p className="text-gray-500 text-sm mt-2">
             Tikai autorizēti administratori var piekļūt admin panelim.
           </p>
         </div>

         <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-6">
           <div className="flex items-center justify-center space-x-3 mb-3">
             <User className="w-5 h-5 text-red-600" />
             <span className="text-red-800 font-semibold">Nepieciešamās tiesības</span>
           </div>
           <p className="text-red-700 text-sm">
             Lai piekļūtu šai lapai, jūsu kontam jābūt ar administratora statusu. 
             Sazinieties ar sistēmas administratoru, ja domājat, ka šis ir kļūda.
           </p>
         </div>

         <div className="space-y-3 pt-4">
           <Link href="/" className="block">
             <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200">
               <Home className="w-5 h-5 mr-2" />
               Atgriezties sākumlapā
             </Button>
           </Link>
         </div>

         <div className="pt-4 border-t border-gray-100">
           <p className="text-xs text-gray-400">
             Nepieciešama palīdzība? Sazinieties ar{' '}
             <span className="text-red-500 font-medium">support@martasmebeles.lv</span>
           </p>
         </div>
       </div>
     </div>
   </div>
 )
}