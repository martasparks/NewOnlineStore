'use client'
import { useEffect } from 'react'
import { useAlert } from '../../../lib/store/alert'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export default function AlertMessage() {
  const { message, type, show, hideAlert } = useAlert()

  useEffect(() => {
    if (show) {
      const timeout = setTimeout(() => hideAlert(), 4000) // Palielināts laiks
      return () => clearTimeout(timeout)
    }
  }, [show, hideAlert])

  if (!show) return null

  const getAlertConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-emerald-50 border-emerald-200',
          iconColor: 'text-emerald-600',
          textColor: 'text-emerald-800',
          progressColor: 'bg-emerald-500'
        }
      case 'error':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-800',
          progressColor: 'bg-red-500'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50 border-yellow-200',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-800',
          progressColor: 'bg-yellow-500'
        }
      case 'info':
        return {
          icon: Info,
          bgColor: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-800',
          progressColor: 'bg-blue-500'
        }
      default:
        return {
          icon: Info,
          bgColor: 'bg-gray-50 border-gray-200',
          iconColor: 'text-gray-600',
          textColor: 'text-gray-800',
          progressColor: 'bg-gray-500'
        }
    }
  }

  const config = getAlertConfig()
  const Icon = config.icon

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full">
      <div 
        className={`
          ${config.bgColor} 
          border rounded-xl shadow-lg backdrop-blur-sm 
          transform transition-all duration-300 ease-out
          animate-in slide-in-from-top-2 fade-in-0
          hover:scale-105 cursor-pointer
          relative overflow-hidden
        `}
        onClick={hideAlert}
      >
        {/* Animēts progress bar */}
        <div 
          className={`absolute bottom-0 left-0 h-1 ${config.progressColor} animate-pulse`}
          style={{
            width: '100%',
            animation: 'shrink 4000ms linear forwards'
          }}
        />
        
        <div className="p-4 flex items-start space-x-3">
          {/* Ikona */}
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          
          {/* Saturs */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${config.textColor} leading-relaxed`}>
              {message}
            </p>
          </div>
          
          {/* Aizvērt poga */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              hideAlert()
            }}
            className={`
              flex-shrink-0 ${config.iconColor} hover:${config.textColor} 
              transition-colors duration-200 p-1 rounded-md hover:bg-white/50
            `}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}