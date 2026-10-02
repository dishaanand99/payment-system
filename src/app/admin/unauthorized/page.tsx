export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center bg-white p-10 rounded-xl shadow-xl shadow-gray-200/50 border border-gray-100">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-rose-100">
          <svg className="h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-sm text-gray-600">
          You do not have permission to view this page. If you believe this is an error, please contact your administrator.
        </p>
        <div className="mt-8">
          <a href="/admin" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            Return to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
