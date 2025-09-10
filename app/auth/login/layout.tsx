
// app/login/layout.tsx
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {children}
    </div>
  )
}