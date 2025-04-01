export const Hero = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-32">
      <div className="text-center space-y-8">
        <h2 className="text-5xl sm:text-6xl font-bold max-w-3xl mx-auto leading-tight">
          Ship with confidence, <br />
          <span className="text-purple-400">deploy without surprises</span>
        </h2>
        <p className="text-xl max-w-2xl mx-auto text-purple-200">
          A free, instant AI-powered analysis of your repository to catch
          deployment issues before they catch you.
        </p>
        {/*             A free tool to analyze your personal projects and applications to give you piece of mind before you hit deploy */}
        {/* CTA Section */}
        <div className="flex flex-col w-full max-w-2xl mx-auto gap-4 mt-12">
          <div className="flex flex-col sm:flex-row w-full gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="https://github.com/richieb21/deployable"
                className="w-full px-6 py-4 bg-gray-900/50 border-2 border-gray-700 rounded-xl 
                         focus:outline-none focus:border-gray-500
                         placeholder:text-gray-500
                         text-purple-200"
              />
            </div>
            <button
              className="px-8 py-4 bg-gray-900 text-gray-400 rounded-xl font-semibold 
                        hover:bg-gray-800 hover:text-gray-300 transition whitespace-nowrap"
            >
              Deploy!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
