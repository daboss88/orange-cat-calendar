import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ChefHat,
  ShoppingBag,
  Truck,
  PackageCheck,
  Ban,
  PawPrint,
  RotateCcw,
  Eye,
  Edit3,
  MessageCircle,
} from "lucide-react";

/**
 * Set this to false before deploying publicly if you only want customers to view.
 * true = local editable version for you
 * false = viewer-only version for customers
 */
const SHOW_EDITOR = false;

const STORAGE_KEY = "orange-cat-bake-calendar-events-v1";

const EVENT_TYPES = {
  close: {
    label: "Orders close",
    short: "Close",
    icon: Clock3,
    bg: "#FFE7C9",
    text: "#7B3F1D",
    border: "#F7B267",
    dot: "#F7A44A",
  },
  ingredients: {
    label: "Buy ingredients",
    short: "Ingredients",
    icon: ShoppingBag,
    bg: "#FFECE8",
    text: "#843E35",
    border: "#F4A29A",
    dot: "#E7776A",
  },
  bake: {
    label: "Bake day",
    short: "Bake",
    icon: ChefHat,
    bg: "#FFF4BD",
    text: "#6A5314",
    border: "#E5C94F",
    dot: "#D9B72E",
  },
  delivery: {
    label: "Delivery / pickup",
    short: "Delivery",
    icon: Truck,
    bg: "#E9F5E7",
    text: "#365B31",
    border: "#96C78E",
    dot: "#6AA85F",
  },
  soldOut: {
    label: "Sold out",
    short: "Sold out",
    icon: PackageCheck,
    bg: "#EEE5FF",
    text: "#4A3178",
    border: "#B9A1EA",
    dot: "#8D6BD1",
  },
  unavailable: {
    label: "Unavailable",
    short: "Off",
    icon: Ban,
    bg: "#EFEFEF",
    text: "#565656",
    border: "#CFCFCF",
    dot: "#888888",
  },
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad = (value) => String(value).padStart(2, "0");

const makeDateKey = (year, monthIndex, day) =>
  `${year}-${pad(monthIndex + 1)}-${pad(day)}`;

const defaultEvents = {
  "2026-06-03": ["close"],
  "2026-06-04": ["ingredients"],
  "2026-06-05": ["bake"],
  "2026-06-06": ["delivery"],
  "2026-06-10": ["close"],
  "2026-06-11": ["ingredients"],
  "2026-06-12": ["bake"],
  "2026-06-13": ["delivery"],
  "2026-06-17": ["close"],
  "2026-06-18": ["ingredients"],
  "2026-06-19": ["bake"],
  "2026-06-20": ["delivery", "soldOut"],
  "2026-06-24": ["close"],
  "2026-06-25": ["ingredients"],
  "2026-06-26": ["bake"],
  "2026-06-27": ["delivery"],
  "2026-07-08": ["close"],
};

function buildCalendarCells(year, monthIndex) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDay = new Date(year, monthIndex, 1).getDay();

  // Monday-first calendar.
  const leadingBlankDays = (firstDay + 6) % 7;
  const cells = [];

  for (let i = 0; i < leadingBlankDays; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function EventPill({ type, compact = false }) {
  const event = EVENT_TYPES[type];

  if (!event) return null;

  const Icon = event.icon;

  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-black leading-none"
      style={{
        background: event.bg,
        color: event.text,
        borderColor: event.border,
      }}
    >
      {!compact && <Icon size={11} strokeWidth={2.4} />}
      {event.short}
    </span>
  );
}

function DateCell({
  day,
  year,
  monthIndex,
  eventsByDate,
  selectedDate,
  onSelectDate,
  interactive,
}) {
  if (!day) {
    return <div className="min-h-[104px] rounded-2xl bg-white/25" />;
  }

  const dateKey = makeDateKey(year, monthIndex, day);
  const events = eventsByDate[dateKey] || [];
  const isSelected = selectedDate === dateKey;

  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={() => interactive && onSelectDate(dateKey)}
      className="min-h-[104px] rounded-2xl border p-2 text-left shadow-sm transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-md"
      style={{
        background: events.length ? "#FFF9EF" : "#FFFDF8",
        borderColor: isSelected
          ? "#4A2818"
          : events.length
            ? "#E5B17B"
            : "#F3D9BE",
        boxShadow: isSelected ? "0 0 0 3px rgba(74,40,24,0.12)" : undefined,
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F68B45] text-xs font-black text-white">
          {day}
        </span>

        {events.length > 0 && (
          <div className="flex gap-1">
            {events.slice(0, 3).map((type) => (
              <span
                key={type}
                className="h-2 w-2 rounded-full"
                style={{ background: EVENT_TYPES[type]?.dot }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {events.slice(0, 2).map((type) => (
          <EventPill key={type} type={type} compact />
        ))}

        {events.length > 2 && (
          <span className="text-[10px] font-black text-[#7B4A2E]">
            +{events.length - 2}
          </span>
        )}
      </div>
    </button>
  );
}

function EditorPanel({
  selectedDate,
  eventsByDate,
  onToggleEvent,
  onClearDate,
  onResetAll,
  onCopyExport,
  copied,
  viewMode,
  setViewMode,
}) {
  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  return (
    <aside className="rounded-[28px] border-2 border-[#F6D7B8] bg-white/75 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#A45128]">
            Editor
          </p>
          <h2 className="text-xl font-black text-[#4A2818]">Click a date</h2>
        </div>

        <button
          type="button"
          onClick={() => setViewMode(viewMode === "edit" ? "preview" : "edit")}
          className="rounded-full bg-[#F68B45] p-2 text-white transition hover:bg-[#A45128]"
          title={viewMode === "edit" ? "Preview customer view" : "Back to editor"}
        >
          {viewMode === "edit" ? <Eye size={17} /> : <Edit3 size={17} />}
        </button>
      </div>

      <div className="mb-4 rounded-2xl bg-[#FFF7EA] p-3">
        <p className="text-xs font-bold text-[#8A5432]">Selected date</p>
        <p className="text-lg font-black text-[#4A2818]">
          {selectedDate || "None selected"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {Object.entries(EVENT_TYPES).map(([type, event]) => {
          const checked = selectedEvents.includes(type);
          const Icon = event.icon;

          return (
            <button
              key={type}
              type="button"
              disabled={!selectedDate}
              onClick={() => onToggleEvent(type)}
              className="flex items-center justify-between rounded-2xl border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: checked ? event.bg : "#FFFFFF",
                borderColor: checked ? event.border : "#F1D6BB",
                color: checked ? event.text : "#5B351F",
              }}
            >
              <span className="flex items-center gap-2 text-sm font-black">
                <Icon size={16} />
                {event.label}
              </span>
              <span className="text-xs font-black">{checked ? "ON" : "OFF"}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!selectedDate}
        onClick={onClearDate}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#F1D6BB] bg-white px-3 py-2 text-sm font-black text-[#7B4A2E] transition hover:bg-[#FFF7EA] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <RotateCcw size={15} />
        Clear selected date
      </button>

      <button
        type="button"
        onClick={onResetAll}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4A2818] px-3 py-2 text-sm font-black text-white transition hover:bg-[#A45128]"
      >
        <RotateCcw size={15} />
        Reset all to default
      </button>

      <button
        type="button"
        onClick={onCopyExport}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F68B45] px-3 py-2 text-sm font-black text-white transition hover:bg-[#A45128]"
      >
        <CalendarDays size={15} />
        {copied ? "Copied schedule!" : "Export schedule"}
      </button>

      <p className="mt-4 text-xs font-bold leading-relaxed text-[#8A5432]">
        Your edits are saved in this browser automatically. To make this
        customer-only later, set SHOW_EDITOR to false before deploying.
      </p>
    </aside>
  );
}

function LegendItem({ type }) {
  const event = EVENT_TYPES[type];

  if (!event) return null;

  return (
    <div className="flex items-center gap-2 rounded-full bg-white/75 px-3 py-2 shadow-sm">
      <span
        className="h-3 w-3 rounded-full"
        style={{ background: event.dot }}
      />
      <span className="text-xs font-black text-[#5B351F]">{event.label}</span>
    </div>
  );
}

function InfoCard({ title, children, icon }) {
  return (
    <div className="rounded-3xl border-2 border-[#F6D7B8] bg-white/75 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wide text-[#A45128] sm:justify-start">
        {icon}
        {title}
      </div>
      <p className="text-center text-sm font-black leading-relaxed text-[#4A2818] sm:text-left">
        {children}
      </p>
    </div>
  );
}

export default function App() {
  const [year, setYear] = useState(2026);
  const [monthIndex, setMonthIndex] = useState(5);
  const [selectedDate, setSelectedDate] = useState("2026-06-20");
  const [viewMode, setViewMode] = useState(SHOW_EDITOR ? "edit" : "preview");
  const [copied, setCopied] = useState(false);

  const [eventsByDate, setEventsByDate] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultEvents;
    } catch {
      return defaultEvents;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(eventsByDate));
    } catch {
      // Ignore localStorage errors.
    }
  }, [eventsByDate]);

  const cells = useMemo(
    () => buildCalendarCells(year, monthIndex),
    [year, monthIndex]
  );

  const weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const changeMonth = (direction) => {
    const next = new Date(year, monthIndex + direction, 1);
    setYear(next.getFullYear());
    setMonthIndex(next.getMonth());
    setSelectedDate("");
  };

  const toggleEvent = (type) => {
    if (!selectedDate) return;

    setEventsByDate((current) => {
      const existing = current[selectedDate] || [];
      const nextEvents = existing.includes(type)
        ? existing.filter((item) => item !== type)
        : [...existing, type];

      const next = { ...current };

      if (nextEvents.length) {
        next[selectedDate] = nextEvents;
      } else {
        delete next[selectedDate];
      }

      return next;
    });
  };

  const clearDate = () => {
    if (!selectedDate) return;

    setEventsByDate((current) => {
      const next = { ...current };
      delete next[selectedDate];
      return next;
    });
  };

  const resetAll = () => {
    setEventsByDate(defaultEvents);
    setSelectedDate("");
  };

  const copyExport = async () => {
    const sortedEvents = Object.keys(eventsByDate)
      .sort()
      .reduce((acc, dateKey) => {
        acc[dateKey] = eventsByDate[dateKey];
        return acc;
      }, {});

    const exportText = `const defaultEvents = ${JSON.stringify(sortedEvents, null, 2)};`;

    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this schedule block:", exportText);
    }
  };

  const isEditable = SHOW_EDITOR && viewMode === "edit";

  return (
    <main
      className="w-full overflow-x-hidden bg-[#F7EADB] p-2 sm:p-6"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-[28px] bg-[#F68B45] p-3 shadow-2xl sm:rounded-[34px] sm:p-6">
        <div className="rounded-[24px] bg-[#FFF7EA] p-3 shadow-xl sm:rounded-[28px] sm:p-6">
          <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#F68B45] px-4 py-2 text-sm font-black uppercase tracking-wide text-white shadow-sm">
                <PawPrint size={16} />
                The Orange Cat Bakery
              </div>

              <h1 className="text-3xl font-black tracking-tight text-[#4A2818] sm:text-5xl">
                {MONTHS[monthIndex]} Bake Calendar
              </h1>

              <p className="mt-2 text-base font-bold text-[#8A5432] sm:text-lg">
                Basque cheesecake pre-order schedule
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-white/75 p-2 shadow-sm">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="rounded-full bg-[#FFF7EA] p-2 text-[#4A2818] transition hover:bg-[#FFE7C9]"
                title="Previous month"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="min-w-[150px] text-center text-base font-black text-[#4A2818] sm:min-w-[180px] sm:text-lg">
                {MONTHS[monthIndex]} {year}
              </div>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="rounded-full bg-[#FFF7EA] p-2 text-[#4A2818] transition hover:bg-[#FFE7C9]"
                title="Next month"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </header>

          <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-[#FFE7C9] p-4 shadow-sm">
              <div className="mb-1 flex items-center gap-2 text-sm font-black text-[#7B3F1D]">
                <Clock3 size={17} />
                Wednesday
              </div>
              <div className="text-2xl font-black text-[#4A2818]">
                Orders Close
              </div>
            </div>

            <div className="rounded-3xl bg-[#FFF4BD] p-4 shadow-sm">
              <div className="mb-1 flex items-center gap-2 text-sm font-black text-[#6A5314]">
                <ChefHat size={17} />
                Friday
              </div>
              <div className="text-2xl font-black text-[#4A2818]">
                Bake Day
              </div>
            </div>

            <div className="rounded-3xl bg-[#E9F5E7] p-4 shadow-sm">
              <div className="mb-1 flex items-center gap-2 text-sm font-black text-[#365B31]">
                <Truck size={17} />
                Saturday
              </div>
              <div className="text-2xl font-black text-[#4A2818]">
                Delivery / Pickup
              </div>
            </div>
          </section>

          <div
            className={
              SHOW_EDITOR
                ? "grid min-w-0 gap-5 lg:grid-cols-[1fr_310px]"
                : "grid min-w-0 gap-5"
            }
          >
            <section className="min-w-0 overflow-hidden rounded-[28px] bg-[#F7EADB] p-3 shadow-inner sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-2 px-1 sm:hidden">
                <p className="text-xs font-black uppercase tracking-wide text-[#8A5432]">
                  Swipe calendar sideways
                </p>
                <span className="text-lg font-black text-[#F68B45]">→</span>
              </div>

              <div className="w-full max-w-full overflow-x-auto pb-3">
                <div className="min-w-[760px]">
                  <div className="mb-3 grid grid-cols-7 gap-2">
                    {weekdays.map((weekday) => (
                      <div
                        key={weekday}
                        className="rounded-2xl bg-[#F68B45] py-2 text-center text-xs font-black tracking-wide text-white"
                      >
                        {weekday}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {cells.map((day, index) => (
                      <DateCell
                        key={`${day || "blank"}-${index}`}
                        day={day}
                        year={year}
                        monthIndex={monthIndex}
                        eventsByDate={eventsByDate}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        interactive={isEditable}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {SHOW_EDITOR && viewMode === "edit" && (
              <EditorPanel
                selectedDate={selectedDate}
                eventsByDate={eventsByDate}
                onToggleEvent={toggleEvent}
                onClearDate={clearDate}
                onResetAll={resetAll}
                onCopyExport={copyExport}
                copied={copied}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
            )}

            {SHOW_EDITOR && viewMode === "preview" && (
              <aside className="rounded-[28px] border-2 border-[#F6D7B8] bg-white/75 p-4 text-[#4A2818] shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#A45128]">
                  Preview mode
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Customer-facing view
                </h2>

                <p className="mt-3 text-sm font-bold leading-relaxed text-[#8A5432]">
                  Editing controls are hidden in this mode. This is closer to
                  what customers should see.
                </p>

                <button
                  type="button"
                  onClick={() => setViewMode("edit")}
                  className="mt-4 rounded-2xl bg-[#F68B45] px-4 py-2 text-sm font-black text-white transition hover:bg-[#A45128]"
                >
                  Back to editor
                </button>
              </aside>
            )}
          </div>

          <section className="mt-5 flex flex-wrap gap-2">
            <LegendItem type="close" />
            <LegendItem type="ingredients" />
            <LegendItem type="bake" />
            <LegendItem type="delivery" />
            <LegendItem type="soldOut" />
            <LegendItem type="unavailable" />
          </section>

          <section className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <InfoCard title="How to Order" icon={<MessageCircle size={15} />}>
              DM us first and wait for confirmation before making payment.
            </InfoCard>

            <InfoCard title="Delivery Slots" icon={<Truck size={15} />}>
              Standard delivery windows are 10:00 AM – 2:00 PM or 2:00 PM – 4:00 PM.
            </InfoCard>

            <InfoCard title="Special Timing" icon={<PawPrint size={15} />}>
              Outside these slots, please DM first — the orange cat will confirm
              if we can arrange it.
            </InfoCard>
          </section>
        </div>
      </section>
    </main>
  );
}