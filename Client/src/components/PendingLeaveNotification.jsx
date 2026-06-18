import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, X, Sparkles } from "lucide-react";
import { usePendingLeaveNotification } from "../hooks/usePendingLeaveNotification.js";

const PendingLeaveNotification = () => {
  const {
    pendingLeaveCount,
    firstThreePendingRequests,
    isVisible,
    dismiss,
  } = usePendingLeaveNotification();

  return (
	    <AnimatePresence>
	      {isVisible && pendingLeaveCount > 0 ? (
        <motion.div
          key="pending-leave-popup"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.4 }}
          className="fixed top-[30px] right-[30px] z-[9999] w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 p-5 text-slate-900 shadow-[0_24px_70px_-28px_rgba(37,99,235,0.35)] backdrop-blur-2xl md:w-[90vw] md:max-w-none lg:w-[420px] lg:max-w-[420px] max-md:bottom-4 max-md:left-4 max-md:right-4 max-md:top-auto max-md:w-auto max-md:max-w-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,255,0.88) 100%)",
            boxShadow: "0 24px 70px -30px rgba(59, 130, 246, 0.35)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
            <div className="absolute -right-8 top-10 h-24 w-24 rounded-full bg-blue-200/40 blur-3xl" />
            <div className="absolute left-8 top-0 h-20 w-20 rounded-full bg-rose-200/35 blur-3xl" />
            <div className="absolute bottom-0 right-10 h-16 w-16 rounded-full bg-violet-200/30 blur-2xl" />
          </div>

          <div className="relative">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-gradient-to-br from-rose-50 via-white to-blue-50 shadow-[0_10px_30px_-12px_rgba(96,165,250,0.75)]">
                  <CalendarDays className="h-8 w-8 text-blue-600" />
                </div>
                <div className="pt-1">
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    SuperAdmin Alert
                  </div>
                  <h3 className="mt-3 max-w-[260px] text-[28px] font-extrabold leading-[1.05] tracking-[-0.04em] text-slate-900 max-md:text-[24px]">
                    Leave Requests
                    <br />
                    Pending Approval
                  </h3>
	                </div>
	              </div>
	            </div>

	            <p className="max-w-[330px] text-[18px] leading-8 text-slate-600 max-md:text-[16px] max-md:leading-7">
	              These leave requests are pending. You have <span className="font-semibold text-indigo-600">{pendingLeaveCount}</span> waiting for approval.
	            </p>

            <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/75 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              {firstThreePendingRequests.map((request, index) => (
                <div
                  key={request.id}
                  className={`flex items-center justify-between gap-3 px-4 py-4 ${
                    index !== firstThreePendingRequests.length - 1 ? "border-b border-slate-200/70" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-gradient-to-br from-sky-100 via-white to-rose-100 text-sm font-bold text-slate-700 shadow-sm">
                      {request.avatarLabel}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-slate-900">
                        {request.employeeName}
                      </p>
                      <p className="truncate text-[13px] text-slate-500">
                        {request.leaveType}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 text-right">
                    <div className="text-[12px] text-slate-500">
                      <div className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{request.leaveDate}</span>
                      </div>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_0_4px_rgba(251,146,60,0.18)]" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 text-[15px] font-semibold text-slate-700 shadow-sm transition hover:bg-white"
              >
                Dismiss
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default PendingLeaveNotification;
