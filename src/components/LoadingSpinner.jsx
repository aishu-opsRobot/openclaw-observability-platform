export default function LoadingSpinner({ message = "正在加载…", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-20 text-sm text-gray-400 ${className}`}>
      <svg className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
