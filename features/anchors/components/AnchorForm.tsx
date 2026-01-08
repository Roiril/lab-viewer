"use client";

import { Loader2, MapPin, Save, X } from "lucide-react";

interface AnchorFormProps {
    label: string;
    description: string;
    onLabelChange: (val: string) => void;
    onDescriptionChange: (val: string) => void;
    onSave: () => void;
    onCancel: () => void;
    onBackToLocation: () => void;
    isSaving: boolean;
    isComposing: React.MutableRefObject<boolean>;
}

export const AnchorForm = ({
    label,
    description,
    onLabelChange,
    onDescriptionChange,
    onSave,
    onCancel,
    onBackToLocation,
    isSaving,
    isComposing,
}: AnchorFormProps) => {
    const stopInputPropagation = (e: React.SyntheticEvent) => {
        e.stopPropagation();
        if (e.nativeEvent) {
            e.nativeEvent.stopImmediatePropagation();
        }
    };

    return (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-end pb-12 pointer-events-none">
            <button
                onClick={onCancel}
                className="absolute top-24 right-8 rounded-full bg-slate-900/40 p-3.5 text-white backdrop-blur-2xl border border-white/10 hover:bg-slate-800 transition-all active:scale-90 pointer-events-auto"
            >
                <X className="h-6 w-6" />
            </button>

            <div className="w-[92%] max-w-sm rounded-[2rem] bg-slate-950/80 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-3xl animate-in slide-in-from-bottom-10 duration-500 pointer-events-auto">
                <div className="flex items-center gap-3 mb-5 text-teal-400">
                    <div className="p-2 rounded-xl bg-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                        <MapPin className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-black tracking-[0.2em] uppercase">配置完了</span>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-2.5 uppercase tracking-[0.2em] ml-1">
                            名前
                        </label>
                        <input
                            autoFocus
                            type="text"
                            onCompositionStart={() => { isComposing.current = true; }}
                            onCompositionEnd={() => { isComposing.current = false; }}
                            onPointerDown={stopInputPropagation}
                            onKeyDown={(e) => !isComposing.current && stopInputPropagation(e)}
                            onKeyUp={stopInputPropagation}
                            className="w-full rounded-2xl bg-white/5 border border-white/5 px-5 py-4 text-base text-white focus:bg-white/10 focus:border-blue-500/50 focus:outline-none transition-all placeholder:text-slate-600 shadow-inner"
                            placeholder="意図に名前を付けてください..."
                            value={label}
                            onChange={(e) => onLabelChange(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-teal-400 mb-2.5 uppercase tracking-[0.2em] ml-1">
                            あなたの意図 (必須)
                        </label>
                        <textarea
                            onCompositionStart={() => { isComposing.current = true; }}
                            onCompositionEnd={() => { isComposing.current = false; }}
                            onPointerDown={stopInputPropagation}
                            onKeyDown={(e) => !isComposing.current && stopInputPropagation(e)}
                            onKeyUp={stopInputPropagation}
                            className="w-full rounded-2xl bg-white/5 border border-white/5 px-5 py-4 text-base text-white focus:bg-white/10 focus:border-teal-500/50 focus:outline-none transition-all placeholder:text-slate-600 resize-none min-h-[120px] shadow-inner"
                            placeholder="例：「集中しているので、今は話しかけないでください」「休憩中です。雑談歓迎！」など"
                            value={description}
                            onChange={(e) => onDescriptionChange(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={onBackToLocation}
                            onPointerDown={stopInputPropagation}
                            className="flex-1 rounded-2xl bg-white/5 py-4 text-sm font-bold text-slate-400 hover:bg-white/10 transition-all active:scale-95"
                        >
                            位置を調整
                        </button>
                        <button
                            onClick={onSave}
                            onPointerDown={stopInputPropagation}
                            disabled={!label || !description || isSaving}
                            className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-30 disabled:grayscale transition-all shadow-[0_8px_25px_rgba(37,99,235,0.4)] active:scale-95 shadow-blue-900/20"
                        >
                            {isSaving ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Save className="h-5 w-5" />
                            )}
                            意図を保存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
