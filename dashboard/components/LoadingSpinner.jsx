export default function LoadingSpinner({ fullScreen = false }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-slate-100"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-600 animate-spin"></div>
      </div>
      <p className="text-sm font-medium text-slate-500 animate-pulse">Memuat data...</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return (
    <div className="py-12 flex justify-center">
      {spinner}
    </div>
  )
}
