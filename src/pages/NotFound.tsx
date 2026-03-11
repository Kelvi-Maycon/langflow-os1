import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
          <span className="text-4xl font-black text-slate-400">404</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Page Not Found</h1>
        <p className="text-lg text-slate-500">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all duration-300 shadow-md hover:scale-[1.02] active:scale-95 mt-4"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}

export default NotFound
