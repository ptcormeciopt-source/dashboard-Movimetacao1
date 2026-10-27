import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

export interface DateRange {
  startDate: string | null; // Format: YYYY-MM-DD
  endDate: string | null;   // Format: YYYY-MM-DD
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reference date for calendar view (defaults to today or selected start date)
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (dateRange.startDate) {
      const [y, m, d] = dateRange.startDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  // Temporary selection state while interacting with calendar
  const [tempStart, setTempStart] = useState<string | null>(dateRange.startDate);
  const [tempEnd, setTempEnd] = useState<string | null>(dateRange.endDate);

  // Sync temp state with props when opening
  useEffect(() => {
    if (isOpen) {
      setTempStart(dateRange.startDate);
      setTempEnd(dateRange.endDate);
      if (dateRange.startDate) {
        const [y, m] = dateRange.startDate.split('-').map(Number);
        setViewDate(new Date(y, m - 1, 1));
      }
    }
  }, [isOpen, dateRange]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Helper to format date string to DD/MM/YYYY
  const formatDisplayDate = (isoStr: string | null) => {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Calendar math
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const clickedDateStr = `${year}-${formattedMonth}-${formattedDay}`;

    if (!tempStart || (tempStart && tempEnd)) {
      // First click: set start date
      setTempStart(clickedDateStr);
      setTempEnd(null);
    } else {
      // Second click: set end date
      if (clickedDateStr < tempStart) {
        setTempEnd(tempStart);
        setTempStart(clickedDateStr);
      } else {
        setTempEnd(clickedDateStr);
      }
    }
  };

  const handleApply = () => {
    onChange({
      startDate: tempStart,
      endDate: tempEnd || tempStart
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStart(null);
    setTempEnd(null);
    onChange({
      startDate: null,
      endDate: null
    });
    setIsOpen(false);
  };

  // Preset handlers
  const setPreset = (type: 'today' | 'yesterday' | '7days' | '15days' | 'this_month' | 'last_month') => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    let start = todayStr;
    let end = todayStr;

    if (type === 'yesterday') {
      const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      start = yest.toISOString().slice(0, 10);
      end = start;
    } else if (type === '7days') {
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start = d7.toISOString().slice(0, 10);
      end = todayStr;
    } else if (type === '15days') {
      const d15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      start = d15.toISOString().slice(0, 10);
      end = todayStr;
    } else if (type === 'this_month') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      start = `${y}-${m}-01`;
      end = todayStr;
    } else if (type === 'last_month') {
      const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const mIndex = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const m = String(mIndex + 1).padStart(2, '0');
      const lastDay = new Date(y, mIndex + 1, 0).getDate();
      start = `${y}-${m}-01`;
      end = `${y}-${m}-${lastDay}`;
    }

    setTempStart(start);
    setTempEnd(end);
    onChange({ startDate: start, endDate: end });
    setIsOpen(false);
  };

  const isRangeActive = Boolean(dateRange.startDate);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
          isRangeActive
            ? 'bg-emerald-950/40 border-emerald-800 text-white shadow-xs'
            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
        }`}
      >
        <CalendarIcon className={`w-3.5 h-3.5 ${isRangeActive ? 'text-emerald-400' : 'text-slate-400'}`} />
        <span className="font-mono">
          {dateRange.startDate ? (
            dateRange.endDate && dateRange.endDate !== dateRange.startDate ? (
              `${formatDisplayDate(dateRange.startDate)} até ${formatDisplayDate(dateRange.endDate)}`
            ) : (
              formatDisplayDate(dateRange.startDate)
            )
          ) : (
            'Filtrar por Data...'
          )}
        </span>
        {isRangeActive && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors ml-1"
            title="Limpar filtro de data"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 w-[340px] sm:w-[380px] bg-[#0c1220] border border-slate-800 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Header with Title and Presets */}
          <div className="space-y-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Selecionar Período</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Presets Strip */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPreset('today')}
                className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setPreset('yesterday')}
                className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Ontem
              </button>
              <button
                type="button"
                onClick={() => setPreset('7days')}
                className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Últimos 7 dias
              </button>
              <button
                type="button"
                onClick={() => setPreset('15days')}
                className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                15 dias
              </button>
              <button
                type="button"
                onClick={() => setPreset('this_month')}
                className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Este Mês
              </button>
            </div>
          </div>

          {/* Calendar Month & Navigation */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-3 px-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-white font-mono">
                {MONTH_NAMES[month]} {year}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-mono text-slate-500 font-medium">
              {WEEKDAY_NAMES.map((name) => (
                <div key={name} className="py-1">{name}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Previous month filler days */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => {
                const dayNum = prevMonthDays - firstDayOfMonth + i + 1;
                return (
                  <div key={`prev-${i}`} className="py-1.5 text-slate-700 text-[11px] select-none">
                    {dayNum}
                  </div>
                );
              })}

              {/* Current month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const formattedM = String(month + 1).padStart(2, '0');
                const formattedD = String(dayNum).padStart(2, '0');
                const dateStr = `${year}-${formattedM}-${formattedD}`;

                const isStart = tempStart === dateStr;
                const isEnd = tempEnd === dateStr;
                const isInRange = tempStart && tempEnd && dateStr > tempStart && dateStr < tempEnd;
                const isSingleSelected = isStart && !tempEnd;

                let dayClass = 'text-slate-300 hover:bg-slate-800/80 hover:text-white';

                if (isStart || isEnd || isSingleSelected) {
                  dayClass = 'bg-emerald-600 text-white font-semibold rounded-md shadow-xs';
                } else if (isInRange) {
                  dayClass = 'bg-emerald-950/50 text-emerald-200';
                }

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => handleDayClick(dayNum)}
                    className={`py-1.5 font-mono text-xs rounded transition-colors ${dayClass}`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual inputs & Active range preview */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 font-medium uppercase mb-1">
                  De (Início)
                </label>
                <input
                  type="date"
                  value={tempStart || ''}
                  onChange={(e) => setTempStart(e.target.value || null)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-medium uppercase mb-1">
                  Até (Fim)
                </label>
                <input
                  type="date"
                  value={tempEnd || ''}
                  onChange={(e) => setTempEnd(e.target.value || null)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-700"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
              >
                Limpar Período
              </button>

              <button
                type="button"
                onClick={handleApply}
                disabled={!tempStart}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium text-xs rounded-lg transition-colors shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aplicar Calendário</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
