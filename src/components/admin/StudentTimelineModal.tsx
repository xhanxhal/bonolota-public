import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Layers, 
  LogIn, 
  Activity, 
  RefreshCw,
  Globe,
  Smartphone
} from 'lucide-react';
import { LicenseRecord, StudentActionEvent } from '../../../server/types';

interface StudentTimelineModalProps {
  license: LicenseRecord;
  onClose: () => void;
}

export const StudentTimelineModal: React.FC<StudentTimelineModalProps> = ({ license, onClose }) => {
  const [actions, setActions] = useState<StudentActionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTimeline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/students/timeline/${license.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setActions(data.actions || []);
      }
    } catch (e) {
      console.error('Failed to load student timeline:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [license.id]);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <LogIn className="w-4 h-4 text-emerald-400" />;
      case 'study_word':
        return <BookOpen className="w-4 h-4 text-teal-400" />;
      case 'quiz_complete':
        return <CheckCircle2 className="w-4 h-4 text-amber-400" />;
      case 'flashcard_review':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'login':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">লগইন</span>;
      case 'study_word':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">শব্দ পাঠ</span>;
      case 'quiz_complete':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">কুইজ সম্পন্ন</span>;
      case 'flashcard_review':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">ফ্ল্যাশ-কার্ড</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">অ্যাকশন</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-bangla">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative animate-scaleUp max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pr-6 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <History className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white truncate">
              শিক্ষার্থী অ্যাকশন টাইমলাইন
            </h3>
            <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
              ছাত্র: <strong className="text-slate-200">{license.customerName || 'বেনামী'}</strong> • {license.plaintextKey || license.keyMasked}
            </p>
          </div>
        </div>

        {/* Overview Bar */}
        <div className="p-3 rounded-2xl bg-[#080d1a] border border-slate-800 mb-3 shrink-0 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500 text-[11px] block">রেকর্ডকৃত অ্যাকশন</span>
              <strong className="text-white font-mono">{actions.length} টি ইভেন্ট</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">বর্তমান সেকশন</span>
              <strong className="text-emerald-400">{license.progress?.activeFeature || 'প্রধান ড্যাশবোর্ড'}</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={loadTimeline}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Timeline Stream */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-2">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>টাইমলাইন ডাটা লোড হচ্ছে...</span>
            </div>
          ) : actions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs bg-[#080d1a] rounded-2xl border border-slate-800">
              <Clock className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-emerald-400" />
              <span>এই শিক্ষার্থীর কোনো অ্যাকশন হিস্ট্রি জমা হয়নি।</span>
            </div>
          ) : (
            actions.map((act, idx) => (
              <div
                key={act.id || idx}
                className="p-3 rounded-2xl bg-[#080d1a] border border-slate-800/80 text-xs flex items-start gap-2.5"
              >
                <div className="p-1.5 rounded-xl bg-[#0f172a] border border-slate-800 shrink-0 mt-0.5">
                  {getActionIcon(act.actionType)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5">
                      {getActionBadge(act.actionType)}
                      {act.activeSection && (
                        <span className="text-[11px] text-emerald-300 font-medium">
                          📍 {act.activeSection}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(act.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-slate-200 font-medium text-xs mt-0.5 leading-relaxed">
                    {act.details}
                  </p>

                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Globe className="w-3 h-3 text-slate-500" />
                      {act.clientIp || 'Unknown IP'}
                    </span>
                    {act.deviceInfo && (
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <Smartphone className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{act.deviceInfo}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
