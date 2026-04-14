import { StrictMode, useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./api";
import { Dashboard } from "./Dashboard";
import {
  MenuIcon, XIcon, TrendingUpIcon, CheckCircleIcon, SunIcon, MoonIcon,
} from "./icons";
import "./index.css";

const MENU_ITEMS = [
  {
    category: "ANÁLISE DE DADOS",
    Icon: TrendingUpIcon,
    items: [
      { id: "seguranca", label: "SEGURANÇA" },
      { id: "telemetria", label: "TELEMETRIA" },
      { id: "comparativo", label: "COMPARATIVO" },
    ],
  },
];

function App() {
  const [activeMenu, setActiveMenu] = useState("comparativo");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const fetchDashboard = useCallback(async () => {
    try {
      setDashboard(await api.dashboard(activeMenu));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  }, [activeMenu]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className="flex h-screen bg-n-bg overflow-hidden text-n-text transition-colors duration-300">
      {/* Toasts */}
      <div className="fixed top-4 right-4 sm:top-20 sm:right-8 z-[100] flex flex-col gap-3 sm:gap-4 pointer-events-none w-[calc(100%-2rem)] sm:w-auto max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toast pointer-events-auto border-4 border-n-border p-3 sm:p-4 neo-shadow flex items-center gap-3 ${
              t.type === "success" ? "bg-n-green text-n-on" : "bg-n-red text-n-on"
            }`}
          >
            <CheckCircleIcon />
            <span className="font-black uppercase tracking-tight text-xs sm:text-sm">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-n-card transition-all duration-300 flex flex-col border-r-4 border-n-border shadow-[4px_0_0_0_var(--shadow-color)] md:shadow-[6px_0_0_0_var(--shadow-color)] z-50 fixed md:relative h-full ${
          sidebarOpen ? "translate-x-0 w-[280px] sm:w-80" : "-translate-x-full md:translate-x-0 md:w-24"
        }`}
      >
        {/* Brand */}
        <div className="h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 border-b-4 border-n-border bg-n-yellow text-black flex-shrink-0">
          {(sidebarOpen || isMobile) && (
            <span className="font-black text-2xl sm:text-3xl font-display tracking-tighter uppercase">Ecolimp.</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="neo-button bg-n-inv-bg text-n-inv-text p-1.5 sm:p-2 hover:bg-n-card hover:text-n-text font-bold border-2 border-n-border flex-shrink-0 hidden md:block"
          >
            {sidebarOpen ? <XIcon /> : <MenuIcon />}
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="neo-button bg-n-inv-bg text-n-inv-text p-1.5 sm:p-2 hover:bg-n-card hover:text-n-text font-bold border-2 border-n-border flex-shrink-0 md:hidden"
          >
            <XIcon />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 sm:py-6">
          {MENU_ITEMS.map((group, idx) => (
            <div key={idx} className="mb-6 sm:mb-8">
              {(sidebarOpen || isMobile) ? (
                <div className="px-4 sm:px-6 flex items-center gap-2 font-black text-n-text uppercase tracking-widest mb-3 sm:mb-4 border-b-2 border-n-border pb-2 mx-4 sm:mx-6 text-xs sm:text-sm">
                  <group.Icon /> {group.category}
                </div>
              ) : (
                <div className="flex justify-center mb-4 text-n-text hidden md:flex">
                  <group.Icon />
                </div>
              )}
              <ul className="space-y-2 px-3 sm:px-4">
                {group.items.map((item) => {
                  const isActive = activeMenu === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setActiveMenu(item.id);
                          if (isMobile) setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center text-left px-3 sm:px-4 py-2 sm:py-3 font-bold uppercase text-[10px] sm:text-xs tracking-wider transition-all border-4 ${
                          isActive
                            ? "bg-n-inv-bg text-n-inv-text border-n-border neo-shadow-sm translate-x-1"
                            : "bg-n-card text-n-text border-transparent hover:border-n-border hover:bg-n-bg"
                        } ${!sidebarOpen && !isMobile ? "justify-center px-1 text-[9px] text-center" : ""}`}
                      >
                        {sidebarOpen || isMobile ? item.label : item.label.substring(0, 3)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t-4 border-n-border flex items-center bg-n-card flex-shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-n-green text-n-on border-4 border-n-border flex items-center justify-center flex-shrink-0 neo-shadow-sm font-display text-lg sm:text-xl font-black">
            DB
          </div>
          {(sidebarOpen || isMobile) && (
            <div className="ml-3 sm:ml-4 overflow-hidden">
              <p className="text-xs sm:text-sm font-black text-n-text uppercase truncate">Dashboard Central</p>
              <p className="text-[10px] sm:text-xs text-n-muted font-bold uppercase truncate">Visão Operacional</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 sm:h-20 bg-n-card border-b-4 border-n-border flex items-center justify-between px-4 sm:px-10 z-10 flex-shrink-0 relative shadow-[0_4px_0_0_var(--shadow-color)] sm:shadow-[0_6px_0_0_var(--shadow-color)] transition-colors duration-300">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden neo-button bg-n-inv-bg text-n-inv-text p-1.5 sm:p-2 border-2 border-n-border"
            >
              <MenuIcon />
            </button>
            <h1 className="text-lg sm:text-2xl font-black text-n-text uppercase tracking-wide font-display truncate">
              <span className="text-n-muted mr-2 hidden sm:inline">/ </span>
              {MENU_ITEMS.flatMap((g) => g.items).find((i) => i.id === activeMenu)?.label}
            </h1>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="neo-button relative flex items-center w-[72px] h-10 border-4 border-n-border bg-n-bg flex-shrink-0 overflow-hidden"
            title={darkMode ? "Ativar Visão Diurna" : "Ativar Visão Noturna"}
          >
            <div className="absolute left-0 w-[32px] flex justify-center text-n-muted opacity-40"><SunIcon /></div>
            <div className="absolute right-0 w-[32px] flex justify-center text-n-muted opacity-40"><MoonIcon /></div>
            <div className={`absolute top-0 w-[32px] h-[32px] flex items-center justify-center transition-transform duration-300 ease-in-out z-10 ${
              darkMode ? "translate-x-[32px] bg-n-blue border-l-4 border-n-border text-white" : "translate-x-0 bg-n-yellow border-r-4 border-n-border text-black"
            }`}>
              {darkMode ? <MoonIcon /> : <SunIcon />}
            </div>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-10">
          <div className="max-w-[1400px] mx-auto pb-8 sm:pb-0">
            <Dashboard activeView={activeMenu} dashboard={dashboard} darkMode={darkMode} />
          </div>
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
