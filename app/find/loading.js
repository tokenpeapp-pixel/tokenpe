export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 border-4 border-[#7C3AED] border-t-transparent border-solid rounded-full animate-spin mb-6 shadow-lg shadow-[#7C3AED]/20"></div>
      <h2 className="text-[#0F172A] text-xl font-bold mb-2">Finding Clinics...</h2>
      <p className="text-[#64748b] text-sm">Please wait while we load clinics near you.</p>
    </div>
  );
}
