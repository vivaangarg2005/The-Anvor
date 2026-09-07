export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 text-gray-900">
      <div className="max-w-2xl w-full text-center space-y-6 bg-white p-12 rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-4xl font-extrabold tracking-tight text-indigo-600">
          [Brand Name]
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700">
          Purse Store
        </h2>
        
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-lg text-green-700 font-medium">
            ✅ Project foundation is working.
          </p>
        </div>

        <div className="text-left bg-slate-50 p-6 rounded-md space-y-3 font-mono text-sm text-slate-700 border border-slate-200 mt-6 shadow-inner">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="font-bold">Frontend:</span> 
            <span>Next.js (App Router)</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <span className="font-bold">Backend:</span> 
            <span>Express REST API</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold">Database:</span> 
            <span>MongoDB</span>
          </div>
        </div>
      </div>
    </main>
  );
}
