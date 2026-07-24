'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MaintenancePage() {
    const router = useRouter();

    return (
        <div className="fixed inset-0 w-full overflow-y-auto bg-[#FCFCFA] font-sans text-slate-800 flex flex-col">
            {/* Background elements */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40" style={{ backgroundImage: 'linear-gradient(to right, #EDEBE6 1px, transparent 1px), linear-gradient(to bottom, #EDEBE6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-200/15 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-[48%] w-[600px] h-[600px] bg-orange-200/15 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none" />

            <div className="relative flex-1 flex flex-col items-center justify-center p-4 sm:p-6 z-10 min-h-full py-12">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.08)] border border-white/60 p-6 sm:p-8 text-center"
                >
                    <div className="flex justify-center mb-6">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
                            <Wrench className="w-7 h-7 sm:w-8 sm:h-8" />
                        </div>
                    </div>
                    
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-3">
                        Coming Soon!
                    </h1>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        We are currently expanding TokenPe to support this industry. Our engineers are hard at work, and this feature will be live soon!
                    </p>

                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 font-medium mb-8 text-left flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                            <strong className="block text-emerald-800 mb-1">Clinics are fully operational!</strong>
                            Our main queue management system for clinics is live and working perfectly.
                        </div>
                    </div>

                    <button 
                        onClick={() => router.push('/')}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl py-3.5 text-sm shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all hover:-translate-y-0.5"
                    >
                        Return to Homepage <ArrowRight className="w-4 h-4" />
                    </button>
                </motion.div>
                
                <div className="mt-8">
                    <img src="/logo.svg" alt="TokenPe" className="h-8 w-auto brightness-0 opacity-80" />
                </div>
            </div>
        </div>
    );
}
