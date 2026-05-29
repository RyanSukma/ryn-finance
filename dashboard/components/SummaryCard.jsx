export default function SummaryCard({ title, value, description = '', icon, trend = '' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm card-hover relative overflow-hidden group">
      {/* Decorative gradient blur in background */}
      <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-violet-500/5 blur-2xl group-hover:bg-violet-500/10 transition-colors"></div>
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 tracking-tight">
            {value}
          </p>
          
          <div className="mt-2 flex items-center gap-2">
            {trend && (
              <span className={`inline-flex items-center text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend === 'up' ? (
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                ) : (
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                )}
                {trend === 'up' ? '+12%' : '-5%'}
              </span>
            )}
            {description && (
              <span className="text-xs text-slate-500">{description}</span>
            )}
          </div>
        </div>
        
        {icon && (
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}