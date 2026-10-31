import React, { useState, useEffect, useMemo } from 'react';
import NepaliDate from 'nepali-date-converter';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Copy,
  ArrowRightLeft,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

export const NEPALI_MONTHS = [
  { bs: 'वैशाख', en: 'Baisakh', short: 'बैशाख' },
  { bs: 'जेठ', en: 'Jestha', short: 'जेठ' },
  { bs: 'असार', en: 'Ashadh', short: 'असार' },
  { bs: 'श्रावण', en: 'Shrawan', short: 'साउन' },
  { bs: 'भाद्र', en: 'Bhadra', short: 'भदौ' },
  { bs: 'असोज', en: 'Ashwin', short: 'असोज' },
  { bs: 'कार्तिक', en: 'Kartik', short: 'कात्तिक' },
  { bs: 'मंसिर', en: 'Mangsir', short: 'मंसिर' },
  { bs: 'पुष', en: 'Poush', short: 'पुष' },
  { bs: 'माघ', en: 'Magh', short: 'माघ' },
  { bs: 'फागुन', en: 'Falgun', short: 'फागुन' },
  { bs: 'चैत', en: 'Chaitra', short: 'चैत' }
];

export const NEPALI_DAYS = [
  { bs: 'आइत', en: 'Sun', fullBs: 'आइतबार', fullEn: 'Sunday', isHoliday: false },
  { bs: 'सोम', en: 'Mon', fullBs: 'सोमबार', fullEn: 'Monday', isHoliday: false },
  { bs: 'मङ्गल', en: 'Tue', fullBs: 'मङ्गलबार', fullEn: 'Tuesday', isHoliday: false },
  { bs: 'बुध', en: 'Wed', fullBs: 'बुधबार', fullEn: 'Wednesday', isHoliday: false },
  { bs: 'बिही', en: 'Thu', fullBs: 'बिहीबार', fullEn: 'Thursday', isHoliday: false },
  { bs: 'शुक्र', en: 'Fri', fullBs: 'शुक्रबार', fullEn: 'Friday', isHoliday: false },
  { bs: 'शनि', en: 'Sat', fullBs: 'शनिबार', fullEn: 'Saturday', isHoliday: true }
];

export const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function toNepaliDigits(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/\d/g, d => NEPALI_DIGITS[Number(d)]);
}

// Helper to calculate total days in a given BS month of a given BS year
export function getDaysInBSMonth(year, month) {
  for (let d = 32; d >= 29; d--) {
    try {
      const nd = new NepaliDate(year, month, d);
      if (nd.getMonth() === month && nd.getDate() === d) return d;
    } catch (e) {
      // Continue check
    }
  }
  return 30;
}

export default function NepaliCalendarModal({ isOpen, onClose }) {
  // Today's live date in BS and AD
  const [nowDate, setNowDate] = useState(() => new Date());

  // Ticking time effect
  useEffect(() => {
    const timer = setInterval(() => {
      setNowDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's NepaliDate object
  const todayBS = useMemo(() => new NepaliDate(nowDate), [nowDate]);

  // Current calendar viewing year & month
  const [viewYear, setViewYear] = useState(() => todayBS.getYear());
  const [viewMonth, setViewMonth] = useState(() => todayBS.getMonth());

  // Selected date cell for details inspection
  const [selectedDay, setSelectedDay] = useState(() => ({
    year: todayBS.getYear(),
    month: todayBS.getMonth(),
    date: todayBS.getDate()
  }));

  // Active modal tab: 'calendar' | 'converter'
  const [activeTab, setActiveTab] = useState('calendar');

  // Copy feedback state
  const [copiedText, setCopiedText] = useState('');

  // Converter state
  const [convAdInput, setConvAdInput] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [convBsResult, setConvBsResult] = useState('');

  const [convBsYear, setConvBsYear] = useState(todayBS.getYear());
  const [convBsMonth, setConvBsMonth] = useState(todayBS.getMonth());
  const [convBsDay, setConvBsDay] = useState(todayBS.getDate());
  const [convAdResult, setConvAdResult] = useState('');

  // Synchronize when opening
  useEffect(() => {
    if (isOpen) {
      const current = new NepaliDate(new Date());
      setViewYear(current.getYear());
      setViewMonth(current.getMonth());
      setSelectedDay({
        year: current.getYear(),
        month: current.getMonth(),
        date: current.getDate()
      });
    }
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Perform AD to BS conversion
  useEffect(() => {
    try {
      if (!convAdInput) {
        setConvBsResult('');
        return;
      }
      const parts = convAdInput.split('-');
      if (parts.length === 3) {
        const jsDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const nep = new NepaliDate(jsDate);
        setConvBsResult({
          nepali: nep.format('YYYY MMMM DD, ddd', 'np'),
          english: nep.format('YYYY MMMM DD, ddd', 'en'),
          formatted: nep.format('YYYY-MM-DD', 'np')
        });
      }
    } catch (err) {
      setConvBsResult(null);
    }
  }, [convAdInput]);

  // Perform BS to AD conversion
  useEffect(() => {
    try {
      const nep = new NepaliDate(Number(convBsYear), Number(convBsMonth), Number(convBsDay));
      const adObj = nep.getDateObject().AD;
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      setConvAdResult({
        dateStr: `${monthNames[adObj.month]} ${adObj.date}, ${adObj.year}`,
        day: dayNames[adObj.day],
        formatted: `${adObj.year}-${String(adObj.month + 1).padStart(2, '0')}-${String(adObj.date).padStart(2, '0')}`
      });
    } catch (err) {
      setConvAdResult(null);
    }
  }, [convBsYear, convBsMonth, convBsDay]);

  // Calendar calculations
  const calendarData = useMemo(() => {
    const firstDayObj = new NepaliDate(viewYear, viewMonth, 1);
    const startingDayOfWeek = firstDayObj.getDay(); // 0 = Sunday
    const totalDays = getDaysInBSMonth(viewYear, viewMonth);

    // Gregorian range covered by this BS month
    const lastDayObj = new NepaliDate(viewYear, viewMonth, totalDays);
    const startAD = firstDayObj.getDateObject().AD;
    const endAD = lastDayObj.getDateObject().AD;

    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const adRangeStr = `${startAD.date} ${shortMonths[startAD.month]} - ${endAD.date} ${shortMonths[endAD.month]} ${endAD.year}`;

    // Generate days cells
    const days = [];
    for (let day = 1; day <= totalDays; day++) {
      const cellNd = new NepaliDate(viewYear, viewMonth, day);
      const cellAd = cellNd.getDateObject().AD;
      const dayOfWeek = cellNd.getDay();
      const isToday =
        viewYear === todayBS.getYear() &&
        viewMonth === todayBS.getMonth() &&
        day === todayBS.getDate();
      const isSelected =
        selectedDay &&
        selectedDay.year === viewYear &&
        selectedDay.month === viewMonth &&
        selectedDay.date === day;

      days.push({
        day,
        dayNepali: toNepaliDigits(day),
        dayOfWeek,
        isSaturday: dayOfWeek === 6,
        isToday,
        isSelected,
        adDay: cellAd.date,
        adMonthShort: shortMonths[cellAd.month],
        adFull: `${cellAd.year}-${String(cellAd.month + 1).padStart(2, '0')}-${String(cellAd.date).padStart(2, '0')}`
      });
    }

    return {
      startingDayOfWeek,
      totalDays,
      adRangeStr,
      days
    };
  }, [viewYear, viewMonth, todayBS, selectedDay]);

  // Selected date details
  const selectedInfo = useMemo(() => {
    if (!selectedDay) return null;
    try {
      const nd = new NepaliDate(selectedDay.year, selectedDay.month, selectedDay.date);
      const ad = nd.getDateObject().AD;
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const bsMonth = NEPALI_MONTHS[selectedDay.month];
      const bsDayName = NEPALI_DAYS[nd.getDay()];

      const isToday =
        selectedDay.year === todayBS.getYear() &&
        selectedDay.month === todayBS.getMonth() &&
        selectedDay.date === todayBS.getDate();

      return {
        bsFullNp: `${toNepaliDigits(selectedDay.year)} ${bsMonth.bs} ${toNepaliDigits(selectedDay.date)} गते, ${bsDayName.fullBs}`,
        bsFullEn: `${selectedDay.date} ${bsMonth.en} ${selectedDay.year}, ${bsDayName.fullEn}`,
        adFull: `${monthNames[ad.month]} ${ad.date}, ${ad.year} (${dayNames[ad.day]})`,
        adISO: `${ad.year}-${String(ad.month + 1).padStart(2, '0')}-${String(ad.date).padStart(2, '0')}`,
        isSaturday: nd.getDay() === 6,
        isToday
      };
    } catch (e) {
      return null;
    }
  }, [selectedDay, todayBS]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(prev => prev - 1);
      setViewMonth(11);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(prev => prev + 1);
      setViewMonth(0);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new NepaliDate(new Date());
    setViewYear(now.getYear());
    setViewMonth(now.getMonth());
    setSelectedDay({
      year: now.getYear(),
      month: now.getMonth(),
      date: now.getDate()
    });
  };

  // Copy to clipboard helper
  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2200);
  };

  if (!isOpen) return null;

  // Format live Nepal Time
  const liveTimeStr = nowDate.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kathmandu',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[94vh] animate-scaleUp transition-colors"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 dark:from-blue-900 dark:via-indigo-900 dark:to-cyan-900 text-white p-4 sm:p-5 relative select-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg flex-shrink-0 text-white">
                <CalendarIcon className="w-6 h-6 text-cyan-200" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                    <span>नेपाली क्यालेन्डर</span>
                    <span className="text-cyan-300 text-xs sm:text-sm font-semibold">(वि.सं. पात्रो)</span>
                  </h3>
                  <span className="text-[10px] bg-cyan-400/25 text-cyan-200 border border-cyan-400/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden sm:inline">
                    Nepal Time
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-blue-100">
                  <Clock className="w-3.5 h-3.5 text-cyan-300" />
                  <span className="font-mono font-bold tracking-wide">{liveTimeStr}</span>
                  <span className="text-blue-300">•</span>
                  <span className="font-medium text-blue-200 truncate">
                    आज: {toNepaliDigits(todayBS.getYear())} {NEPALI_MONTHS[todayBS.getMonth()].bs} {toNepaliDigits(todayBS.getDate())} ({NEPALI_DAYS[todayBS.getDay()].fullBs})
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/15 transition flex-shrink-0"
              title="Close calendar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-white/15 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition ${
                activeTab === 'calendar'
                  ? 'bg-white text-blue-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>क्यालेन्डर पात्रो</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('converter')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition ${
                activeTab === 'converter'
                  ? 'bg-white text-blue-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>मिति रूपान्तरण (AD ⇄ BS)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'calendar' ? (
            <>
              {/* Month & Year Navigation Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                {/* Month & Year Title */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <select
                      value={viewMonth}
                      onChange={e => setViewMonth(Number(e.target.value))}
                      className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    >
                      {NEPALI_MONTHS.map((m, idx) => (
                        <option key={m.bs} value={idx}>
                          {m.bs} ({m.en})
                        </option>
                      ))}
                    </select>

                    <select
                      value={viewYear}
                      onChange={e => setViewYear(Number(e.target.value))}
                      className="ml-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-black text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer font-mono"
                    >
                      {Array.from({ length: 30 }, (_, i) => 2070 + i).map(yr => (
                        <option key={yr} value={yr}>
                          {toNepaliDigits(yr)} ({yr} BS)
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                    • {calendarData.adRangeStr}
                  </span>
                </div>

                {/* Navigation Arrows + Today Button */}
                <div className="flex items-center space-x-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                    title="Previous Month (अघिल्लो महिना)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleJumpToToday}
                    className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition flex items-center space-x-1"
                    title="Jump to today (आजको मिति)"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>आज</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                    title="Next Month (पछिल्लो महिना)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs select-none">
                {NEPALI_DAYS.map((d, index) => (
                  <div
                    key={d.en}
                    className={`py-2 rounded-xl border text-[11px] sm:text-xs font-black ${
                      d.isHoliday
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
                        : 'bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div>{d.bs}</div>
                    <div className="text-[9px] font-normal opacity-70">{d.en}</div>
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 select-none">
                {/* Empty cells before start of month */}
                {Array.from({ length: calendarData.startingDayOfWeek }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[58px] sm:min-h-[66px] rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-dashed border-slate-200/50 dark:border-slate-800/50"
                  />
                ))}

                {/* Day cells */}
                {calendarData.days.map(d => {
                  const isHoliday = d.isSaturday;
                  return (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => {
                        setSelectedDay({
                          year: viewYear,
                          month: viewMonth,
                          date: d.day
                        });
                      }}
                      className={`min-h-[58px] sm:min-h-[66px] p-1 sm:p-1.5 rounded-xl border transition-all text-left flex flex-col justify-between group relative overflow-hidden ${
                        d.isSelected
                          ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/80 dark:bg-blue-900/30 shadow-md z-10'
                          : d.isToday
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 ring-1 ring-emerald-400/80'
                          : isHoliday
                          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-900/30'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      {/* Top row: BS Date number */}
                      <div className="flex items-center justify-between w-full leading-none">
                        <span
                          className={`text-sm sm:text-base font-black ${
                            d.isToday
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : isHoliday
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {d.dayNepali}
                        </span>

                        {d.isToday && (
                          <span className="text-[8px] sm:text-[9px] font-black uppercase px-1 py-0.2 rounded-full bg-emerald-500 text-white leading-tight">
                            आज
                          </span>
                        )}
                      </div>

                      {/* Bottom row: Gregorian AD Date */}
                      <div className="flex items-center justify-between w-full text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-400 font-mono mt-1">
                        <span className="font-semibold text-slate-500 dark:text-slate-400">
                          {d.adDay}
                        </span>
                        <span className="text-[8px] opacity-75 hidden sm:inline">
                          {d.adMonthShort}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Day Details Inspection Banner */}
              {selectedInfo && (
                <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-800 dark:via-indigo-950/30 dark:to-slate-800 rounded-2xl border border-blue-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-blue-700 dark:text-blue-400">
                        {selectedInfo.isToday ? 'आजको मिति (Today)' : 'छनोट गरिएको मिति (Selected)'}:
                      </span>
                      {selectedInfo.isSaturday && (
                        <span className="text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold px-1.5 py-0.2 rounded">
                          शनिबार (सार्वजनिक बिदा)
                        </span>
                      )}
                    </div>
                    <div className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedInfo.bsFullNp}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      <span className="font-semibold">AD:</span> {selectedInfo.adFull} • <span className="font-mono">{selectedInfo.bsFullEn}</span>
                    </div>
                  </div>

                  {/* Copy Button */}
                  <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedInfo.bsFullNp, 'bs')}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 text-xs font-bold flex items-center space-x-1 shadow-2xs transition"
                      title="Copy Nepali Date"
                    >
                      {copiedText === 'bs' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText === 'bs' ? 'कपी भयो!' : 'प्रतिलिपि (BS)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedInfo.adISO, 'ad')}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 text-xs font-bold flex items-center space-x-1 shadow-2xs transition"
                      title="Copy English Date (YYYY-MM-DD)"
                    >
                      {copiedText === 'ad' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText === 'ad' ? 'Copied AD!' : 'Copy AD'}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Tab 2: Date Converter (AD ⇄ BS) */
            <div className="space-y-6 py-2">
              {/* Section 1: AD to BS */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-black">
                      1
                    </span>
                    <span>अंग्रेजी (AD) बाट नेपाली (वि.सं. BS) रूपान्तरण</span>
                  </h4>
                  <span className="text-[11px] font-medium text-slate-500">AD → BS</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="date"
                    value={convAdInput}
                    onChange={e => setConvAdInput(e.target.value)}
                    className="bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />

                  {convBsResult && (
                    <div className="flex-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-blue-200 dark:border-blue-900 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">नेपाली मिति (BS):</div>
                        <div className="text-sm font-black text-blue-700 dark:text-blue-300">{convBsResult.nepali}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">{convBsResult.english}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(convBsResult.nepali, 'conv_bs')}
                        className="p-2 text-slate-500 hover:text-blue-600"
                        title="Copy converted date"
                      >
                        {copiedText === 'conv_bs' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: BS to AD */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-black">
                      2
                    </span>
                    <span>नेपाली (वि.सं. BS) बाट अंग्रेजी (AD) रूपान्तरण</span>
                  </h4>
                  <span className="text-[11px] font-medium text-slate-500">BS → AD</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    {/* BS Year */}
                    <select
                      value={convBsYear}
                      onChange={e => setConvBsYear(Number(e.target.value))}
                      className="bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {Array.from({ length: 40 }, (_, i) => 2060 + i).map(y => (
                        <option key={y} value={y}>
                          {y} BS ({toNepaliDigits(y)})
                        </option>
                      ))}
                    </select>

                    {/* BS Month */}
                    <select
                      value={convBsMonth}
                      onChange={e => setConvBsMonth(Number(e.target.value))}
                      className="bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {NEPALI_MONTHS.map((m, idx) => (
                        <option key={m.bs} value={idx}>
                          {m.bs} ({m.en})
                        </option>
                      ))}
                    </select>

                    {/* BS Day */}
                    <select
                      value={convBsDay}
                      onChange={e => setConvBsDay(Number(e.target.value))}
                      className="bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {Array.from({ length: 32 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>
                          {d} गते ({toNepaliDigits(d)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {convAdResult && (
                    <div className="flex-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">अंग्रेजी मिति (AD):</div>
                        <div className="text-sm font-black text-indigo-700 dark:text-indigo-300">{convAdResult.dateStr}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                          {convAdResult.day} • {convAdResult.formatted}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(convAdResult.formatted, 'conv_ad')}
                        className="p-2 text-slate-500 hover:text-indigo-600"
                        title="Copy converted AD date"
                      >
                        {copiedText === 'conv_ad' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span>नेपाल मानक समय (Nepal Standard Time, UTC+05:45)</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold transition"
          >
            बन्द गर्नुहोस् (Close)
          </button>
        </div>
      </div>
    </div>
  );
}
