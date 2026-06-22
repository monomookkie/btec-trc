export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '', children }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm ${className}`}>
      {children ?? (
        <>
          <Skeleton className="h-4 w-1/3 mb-4" />
          <SkeletonText lines={3} />
        </>
      )}
    </div>
  );
}

// Compact stat card — works in 2-col and 3-col grids on mobile
export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3 md:p-5 shadow-sm">
      <div className="flex items-center gap-2 md:gap-3">
        <Skeleton className="w-8 h-8 md:w-11 md:h-11 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-4 md:h-6 w-10 md:w-12" />
          <Skeleton className="h-2.5 md:h-3 w-full max-w-[72px]" />
        </div>
      </div>
    </div>
  );
}

// Table row skeleton — mobile hides extra columns
export function SkeletonRow({ cols = 4 }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50">
      <Skeleton className="w-7 h-7 md:w-8 md:h-8 rounded-full flex-shrink-0" />
      <Skeleton className="h-3 flex-1" />
      <Skeleton className="h-3 w-16 flex-none hidden sm:block" />
      {cols > 3 && <Skeleton className="h-3 w-12 flex-none hidden md:block" />}
      {cols > 4 && <Skeleton className="h-3 w-16 flex-none hidden lg:block" />}
    </div>
  );
}

// Course card skeleton
export function SkeletonCourseCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <Skeleton className="h-32 md:h-36 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// UserDashboard
export function UserDashboardSkeleton() {
  return (
    <div className="p-4 md:p-7 space-y-5 md:space-y-6">
      <Skeleton className="h-6 md:h-7 w-40 md:w-48" />
      <Skeleton className="h-36 md:h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {[0,1,2].map(i => <SkeletonStatCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

// AdminDashboard
export function AdminDashboardSkeleton() {
  return (
    <div className="p-4 md:p-7 space-y-5 md:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {[0,1,2,3].map(i => <SkeletonStatCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard>
        {[0,1,2,3,4].map(i => <SkeletonRow key={i} cols={4} />)}
      </SkeletonCard>
    </div>
  );
}

// BrowseCourses
export function BrowseCourseSkeleton() {
  return (
    <div className="p-4 md:p-7 space-y-4 md:space-y-5">
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 w-24 md:w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0,1,2,3,4,5].map(i => <SkeletonCourseCard key={i} />)}
      </div>
    </div>
  );
}

// MyCertificates
export function CertificateSkeleton() {
  return (
    <div className="p-4 md:p-7 space-y-4 md:space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 md:h-6 w-28 md:w-36" />
        <Skeleton className="h-8 md:h-9 w-28 md:w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0,1,2,3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

// MyReport
export function ReportSkeleton() {
  return (
    <div className="p-4 md:p-7 space-y-4 md:space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {[0,1,2,3].map(i => <SkeletonStatCard key={i} />)}
      </div>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

// ProfilePage
export function ProfileSkeleton() {
  return (
    <div className="p-4 md:p-7 max-w-xl space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>
      {/* Avatar card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
        <Skeleton className="w-13 h-13 rounded-full flex-shrink-0" style={{ width: 52, height: 52, borderRadius: '50%' }} />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      {/* Info card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <Skeleton className="h-4 w-36" />
        <div className="space-y-3">
          {[0,1,2].map(i => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      {/* Password card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-3">
          {[0,1,2].map(i => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
}

// UsersPage
export function UsersPageSkeleton() {
  return (
    <div className="p-4 md:p-7 space-y-4 md:space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <Skeleton className="h-9 w-full rounded-xl" />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5">
        {[0,1,2,3,4,5,6].map(i => <SkeletonRow key={i} cols={4} />)}
      </div>
    </div>
  );
}

// CourseManagement
export function CourseManagementSkeleton() {
  return (
    <div className="p-4 md:p-7 space-y-4 md:space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {[0,1,2,3].map(i => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0,1,2,3,4,5].map(i => <SkeletonCourseCard key={i} />)}
      </div>
    </div>
  );
}

// CertificateEngine
export function CertificateEngineSkeleton() {
  return (
    <div className="p-4 md:p-7 space-y-4 md:space-y-5">
      <div className="flex gap-2 mb-2">
        {[0,1,2].map(i => <Skeleton key={i} className="h-9 w-28 rounded-xl" />)}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
        {[0,1,2,3,4].map(i => <SkeletonRow key={i} cols={5} />)}
      </div>
    </div>
  );
}

// Admin Reports
export function AdminReportSkeleton() {
  return (
    <div className="p-4 md:p-7 space-y-4 md:space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {[0,1,2,3].map(i => <SkeletonStatCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard>
        {[0,1,2,3,4,5].map(i => <SkeletonRow key={i} cols={5} />)}
      </SkeletonCard>
    </div>
  );
}
