import { Package } from "lucide-react";

export function ProductPlaceholder({ className }: { className?: string }) {
  return (
    <div className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
          <Package className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-sm text-gray-500">Nav attēla</p>
      </div>
    </div>
  )
}