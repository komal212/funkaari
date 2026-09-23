export function BlobBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="blob absolute -left-24 top-32 h-72 w-72 bg-lavender-200/40 blur-3xl animate-float-slow" />
      <div className="blob-alt absolute -right-20 top-64 h-80 w-80 bg-mint-200/35 blur-3xl animate-float-delay" />
      <div className="blob absolute bottom-32 left-1/4 h-64 w-64 bg-sunny-200/30 blur-3xl animate-float" />
      <div className="blob-alt absolute -bottom-16 right-1/3 h-56 w-56 bg-peach-200/35 blur-3xl animate-float-slow" />
      <div className="absolute top-1/2 right-0 h-48 w-48 rounded-full bg-sky-200/25 blur-3xl animate-float-delay" />
    </div>
  );
}
