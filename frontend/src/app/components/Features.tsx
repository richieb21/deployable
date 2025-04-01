export const Features = () => {
  return (
    <div className="bg-gray-900/50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-lg bg-purple-900/50 flex items-center justify-center border border-purple-500/20">
              <svg
                className="h-6 w-6 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-purple-200">
              Security First
            </h3>
            <p className="text-purple-300/80">
              Identify security vulnerabilities and credential exposure before
              deployment.
            </p>
          </div>

          <div className="space-y-4">
            <div className="h-12 w-12 rounded-lg bg-purple-900/50 flex items-center justify-center border border-purple-500/20">
              <svg
                className="h-6 w-6 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-purple-200">
              Performance Optimized
            </h3>
            <p className="text-purple-300/80">
              Get actionable insights to improve your application's performance.
            </p>
          </div>

          <div className="space-y-4">
            <div className="h-12 w-12 rounded-lg bg-purple-900/50 flex items-center justify-center border border-purple-500/20">
              <svg
                className="h-6 w-6 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-purple-200">
              Best Practices
            </h3>
            <p className="text-purple-300/80">
              Ensure your codebase follows deployment best practices and
              standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
