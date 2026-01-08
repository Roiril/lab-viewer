"use client";

import { Loader2, Scan, EyeOff, Plus } from "lucide-react";

interface AnchorActionButtonsProps {
    isScanning: boolean;
    isRefreshing: boolean;
    onScanClick: () => void;
    onAddClick: () => void;
    disabled: boolean;
}

export const AnchorActionButtons = ({
    isScanning,
    isRefreshing,
    onScanClick,
    onAddClick,
    disabled,
}: AnchorActionButtonsProps) => {
    if (disabled) return null;

    return (
        <div className="absolute bottom-12 left-0 right-0 z-[100] flex justify-center pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-4 p-2.5 rounded-full bg-slate-900/50 backdrop-blur-3xl border border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.5)] transition-all duration-500 hover:bg-slate-900/70">
                <button
                    onClick={onScanClick}
                    disabled={isRefreshing}
                    className={`flex items-center gap-3 px-8 py-4.5 rounded-full font-black transition-all duration-500 ${isScanning
                            ? "bg-teal-500 text-white shadow-[0_0_25px_rgba(20,184,166,0.5)] scale-105 active:scale-95"
                            : "bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white active:scale-95"
                        } ${isRefreshing ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                    {isRefreshing ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : isScanning ? (
                        <Scan className="w-6 h-6" />
                    ) : (
                        <EyeOff className="w-6 h-6" />
                    )}
                    <span className="text-base tracking-[0.1em]">
                        {isRefreshing ? "更新中" : isScanning ? "スキャン中" : "スキャン"}
                    </span>
                </button>

                <button
                    onClick={onAddClick}
                    className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4.5 rounded-full shadow-[0_10px_25px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:shadow-[0_12px_30px_rgba(37,99,235,0.6)] active:scale-95 transition-all font-black group"
                >
                    <Plus className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" />
                    <span className="text-base tracking-[0.1em]">意図を配置</span>
                </button>
            </div>
        </div>
    );
};
