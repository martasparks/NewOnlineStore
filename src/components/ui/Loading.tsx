interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton'
  text?: string
  className?: string
  fullScreen?: boolean
}

export const Loading = ({ 
  size = 'md', 
  variant = 'spinner', 
  text, 
  className = '',
  fullScreen = false 
}: LoadingProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const Spinner = () => (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
  )

  const Dots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div 
          key={i}
          className={`bg-blue-600 rounded-full animate-bounce ${size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'}`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )

  const Pulse = () => (
    <div className={`bg-blue-600 rounded-full animate-pulse ${sizeClasses[size]}`} />
  )

  const Skeleton = () => (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      <div className="h-4 bg-gray-300 rounded w-5/6"></div>
    </div>
  )

  const renderVariant = () => {
    switch (variant) {
      case 'dots': return <Dots />
      case 'pulse': return <Pulse />
      case 'skeleton': return <Skeleton />
      default: return <Spinner />
    }
  }

  const content = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {renderVariant()}
      {text && <p className="mt-2 text-gray-600 text-sm">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return content
}
