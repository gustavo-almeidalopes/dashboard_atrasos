import { ChartView, DonutChart, BarChart } from "./charts";
import {
  DatabaseIcon, ShieldIcon, ActivityIcon, AlertTriangleIcon, RefreshCwIcon,
} from "./icons";

export function Dashboard({ activeView, dashboard: db, darkMode }) {
  const isComp = activeView === "comparativo";
  const isSeg = activeView === "seguranca";
  const isTel = activeView === "telemetria";
  const hasData = db && (db.status.security_loaded || db.status.telemetry_loaded);
  const viewHasData = isComp ? hasData : isSeg ? db?.status.security_loaded : db?.status.telemetry_loaded;

  const cRed = darkMode ? "#E84D4D" : "#C8102E";
  const cBlue = darkMode ? "#4A89DF" : "#00235B";
  const cText = darkMode ? "#F5F5F0" : "#000";
  const cGrid = "#000";
  const cYellow = darkMode ? "#DDF000" : "#F0FE00";
  const cBg = darkMode ? "#262626" : "#fff";
  const cGreen = darkMode ? "#4EAD5B" : "#007A2E";
  const cOrange = darkMode ? "#F59E0B" : "#D97706";
  const cPurple = darkMode ? "#6366F1" : "#4338CA";

  const statusColors = [cRed, cOrange, cBlue, cGreen];
  const riscoColors = [cRed, cOrange, cBlue, cGreen];
  const periodoColors = [cYellow, cOrange, cPurple];
  const acaoColors = [cRed, cOrange, cBlue, cGreen];

  const EMPTY_KPIS = {
    total: 0, unique_plates: 0, avg_delay: 0, max_delay: 0,
    max_delay_plate: "-", avg_delay_formatted: "0m", max_delay_formatted: "0m",
    critical_count: 0, sla_breach_count: 0, reincidence_avg: 0,
  };

  const sStats = db?.kpis_security || EMPTY_KPIS;
  const tStats = db?.kpis_telemetry || EMPTY_KPIS;
  const ranking = db?.ranking?.items || [];
  const combinedUnique = db?.combined_unique_plates || 0;
  const activeKpis = isSeg ? sStats : tStats;

  const pageTitle = isComp ? "Comparativo Geral" : isSeg ? "Painel de Segurança" : "Painel de Telemetria";
  const pageDesc = isComp ? "Análise Consolidada dos Equipamentos" : isSeg ? "Análise Crítica de Segurança" : "Análise Operacional de Telemetria";

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  function getHourChartData() {
    const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}h`);
    const countS = db ? db.hourly_security.data.map((p) => p.count) : Array(24).fill(0);
    const countT = db ? db.hourly_telemetry.data.map((p) => p.count) : Array(24).fill(0);
    const datasets = [];
    if (isComp || isSeg) {
      datasets.push({
        label: "SEGURANÇA", data: countS, borderColor: cRed, backgroundColor: cRed,
        borderWidth: isMobile ? 3 : 5, tension: 0.4, cubicInterpolationMode: "monotone",
        pointRadius: 5, pointHoverRadius: 10, pointBorderWidth: 3, pointBackgroundColor: cBg,
      });
    }
    if (isComp || isTel) {
      datasets.push({
        label: "TELEMETRIA", data: countT, borderColor: cBlue, backgroundColor: cBlue,
        borderWidth: isMobile ? 3 : 5, tension: 0.4, cubicInterpolationMode: "monotone",
        pointRadius: 5, pointHoverRadius: 10, pointBorderWidth: 3, pointBackgroundColor: cBg,
      });
    }
    return { labels, datasets: datasets.filter((ds) => ds.data.some((v) => v > 0)) };
  }

  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { top: 48, left: 12, right: 16 } },
    plugins: {
      datalabels: {
        z: 100, display: (ctx) => ctx.dataset.data[ctx.dataIndex] > 0,
        align: "end", anchor: "end", offset: 8,
        backgroundColor: cBg, borderColor: (ctx) => ctx.dataset.borderColor,
        borderWidth: isMobile ? 2 : 3, borderRadius: 999,
        padding: { top: 4, bottom: 4, left: 12, right: 12 }, color: cText,
        font: { family: "'Space Grotesk'", weight: "bold", size: isMobile ? 10 : 13 },
        formatter: (v) => v,
      },
      legend: {
        position: "top", align: "end",
        labels: {
          font: { family: "'Space Grotesk'", size: isMobile ? 10 : 14, weight: "bold" },
          color: cText, boxWidth: isMobile ? 12 : 16, boxHeight: isMobile ? 12 : 16,
        },
      },
      tooltip: {
        backgroundColor: darkMode ? "#1a1a1a" : "#000", padding: 16,
        titleFont: { family: "Space Grotesk", size: 16 },
        bodyFont: { family: "Inter", size: 14 },
        titleColor: "#fff", bodyColor: "#fff", cornerRadius: 0,
        borderColor: cYellow, borderWidth: 3,
      },
    },
    scales: {
      x: {
        grid: { color: cGrid, lineWidth: isMobile ? 1 : 2, drawTicks: false },
        ticks: { color: cText, font: { weight: "bold", size: isMobile ? 10 : 12 } },
        border: { width: isMobile ? 2 : 4, color: cGrid },
      },
      y: {
        grid: { color: darkMode ? "rgba(0,0,0,.5)" : "rgba(0,0,0,.1)", lineWidth: isMobile ? 1 : 2 },
        ticks: { color: cText, font: { weight: "bold", size: isMobile ? 10 : 12 } },
        beginAtZero: true,
        border: { width: isMobile ? 2 : 4, color: cGrid },
      },
    },
    interaction: { mode: "index", intersect: false },
  };

  function getStatusBadge(val) {
    const map = {
      PERIGO: "bg-n-red text-n-on", "Muito Atrasado": "bg-yellow-500 text-black",
      Atrasado: "bg-n-blue text-n-on", Normal: "bg-n-green text-n-on",
    };
    return map[val] || "bg-n-bg text-n-text";
  }

  function getRiscoBadge(val) {
    const map = {
      "Crítico": "bg-n-red text-n-on", Alto: "bg-yellow-500 text-black",
      "Médio": "bg-n-blue text-n-on", Baixo: "bg-n-green text-n-on",
    };
    return map[val] || "bg-n-bg text-n-text";
  }

  return (
    <div key={activeView} className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-4 sm:gap-6 border-b-4 border-n-border pb-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-n-text uppercase font-display tracking-tight leading-none">{pageTitle}</h2>
          <p className="font-bold text-[10px] sm:text-xs text-black uppercase mt-2 bg-n-yellow inline-block px-2 py-0.5 border-2 border-n-border">{pageDesc}</p>
        </div>
        {hasData && (
          <span className="bg-n-green text-n-on px-3 py-1.5 border-2 border-n-border text-[10px] sm:text-xs font-black uppercase flex items-center gap-2 w-max">
            <DatabaseIcon /> Banco de Dados Conectado
          </span>
        )}
      </div>

      {/* Empty state */}
      {!viewHasData && (
        <div className="border-4 border-dashed border-n-border bg-n-card neo-shadow p-8 sm:p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 border-4 border-n-border bg-n-bg text-n-muted flex items-center justify-center neo-shadow-sm">
            <DatabaseIcon />
          </div>
          <h3 className="font-display font-black text-xl sm:text-2xl uppercase mb-2 text-n-text">Nenhum Dado Disponível</h3>
          <p className="font-bold text-xs sm:text-sm uppercase text-n-muted max-w-md">
            {isComp ? "Nenhum dado encontrado no banco de dados." : isSeg ? "Nenhum dado de segurança encontrado." : "Nenhum dado de telemetria encontrado."}
          </p>
          <p className="font-bold text-[10px] sm:text-xs text-n-muted mt-4 border-t-2 border-n-border pt-4">
            Use <code className="bg-n-bg px-2 py-0.5 border border-n-border">python scripts/seed_db.py --file seu_csv.csv</code>
          </p>
        </div>
      )}

      {viewHasData && (
        <div className="space-y-6 sm:space-y-8 animate-fadeIn">
          {/* Source indicators */}
          <div className="flex flex-col sm:flex-row gap-4">
            {(isComp || isSeg) && db?.status.security_loaded && (
              <div className="flex-1 bg-n-card border-4 border-n-border p-3 sm:p-4 flex items-center neo-shadow-sm text-n-text">
                <span className="bg-n-red text-n-on p-2 border-2 border-n-border flex-shrink-0 mr-3"><ShieldIcon /></span>
                <div className="overflow-hidden">
                  <p className="font-black uppercase text-xs sm:text-sm truncate">Segurança</p>
                  <p className="text-[10px] sm:text-xs font-bold text-n-muted truncate">{db.status.security_rows.toLocaleString()} registros</p>
                </div>
              </div>
            )}
            {(isComp || isTel) && db?.status.telemetry_loaded && (
              <div className="flex-1 bg-n-card border-4 border-n-border p-3 sm:p-4 flex items-center neo-shadow-sm text-n-text">
                <span className="bg-n-blue text-n-on p-2 border-2 border-n-border flex-shrink-0 mr-3"><ActivityIcon /></span>
                <div className="overflow-hidden">
                  <p className="font-black uppercase text-xs sm:text-sm truncate">Telemetria</p>
                  <p className="text-[10px] sm:text-xs font-bold text-n-muted truncate">{db.status.telemetry_rows.toLocaleString()} registros</p>
                </div>
              </div>
            )}
          </div>

          {/* KPI Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {isComp ? (
              <>
                <KpiCard label="Equipamentos Analisados" value={combinedUnique.toLocaleString()} sub="Placas únicas em base" />
                <KpiCard label="Total de Ocorrências" value={(db?.combined_total_rows || 0).toLocaleString()} sub="Linhas processadas" />
                <KpiCard label="Pico: Segurança" value={sStats.max_delay_formatted} sub={`Placa: ${sStats.max_delay_plate}`} variant="red" />
                <KpiCard label="Pico: Telemetria" value={tStats.max_delay_formatted} sub={`Placa: ${tStats.max_delay_plate}`} variant="blue" />
              </>
            ) : (
              <>
                <KpiCard label="Equipamentos" value={activeKpis.unique_plates.toLocaleString()} sub="Placas únicas" />
                <KpiCard label="Total de Ocorrências" value={activeKpis.total.toLocaleString()} sub="Registros" />
                <KpiCard label="Média Inatividade" value={activeKpis.avg_delay_formatted} sub="Tempo médio" variant={isSeg ? "red" : "blue"} />
                <KpiCard label="Pico Inatividade" value={activeKpis.max_delay_formatted} sub={`Placa: ${activeKpis.max_delay_plate}`} variant="inv" labelVariant={isSeg ? "red" : "blue"} />
              </>
            )}
          </div>

          {/* KPI Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <MetricCard icon={<AlertTriangleIcon />} iconBg="bg-n-red" label="Registros Críticos" value={isComp ? sStats.critical_count + tStats.critical_count : activeKpis.critical_count} />
            <MetricCard icon={<ShieldIcon />} iconBg="bg-n-yellow text-black" label="SLA Violado" value={isComp ? sStats.sla_breach_count + tStats.sla_breach_count : activeKpis.sla_breach_count} />
            <MetricCard icon={<RefreshCwIcon />} iconBg="bg-n-blue" label="Reincidência Média" value={`${isComp ? ((sStats.reincidence_avg + tStats.reincidence_avg) / 2).toFixed(1) : (activeKpis.reincidence_avg || 0).toFixed(1)}x`} />
          </div>

          {/* Hourly line chart */}
          <div className="bg-n-card text-n-text border-4 border-n-border neo-shadow p-4 sm:p-6 flex flex-col">
            <div className="mb-4 sm:mb-6 border-b-4 border-n-border pb-2 sm:pb-4">
              <h3 className="font-display font-black text-xl sm:text-2xl uppercase">Volume Horário (24h)</h3>
              <p className="font-bold text-n-muted uppercase text-[10px] sm:text-sm mt-1">Distribuição de alertas ao longo do dia completo</p>
            </div>
            <div className="flex-1 min-h-[300px] sm:min-h-[400px]">
              <ChartView type="line" data={getHourChartData()} options={lineOptions} />
            </div>
          </div>

          {/* Donut charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <DonutChart title="Status" subtitle="Distribuição por gravidade" distData={db?.dist_status?.data} colors={statusColors} darkMode={darkMode} />
            <DonutChart title="Nível de Risco" subtitle="Classificação de risco" distData={db?.dist_risco?.data} colors={riscoColors} darkMode={darkMode} />
            <DonutChart title="Período do Dia" subtitle="Manhã, Tarde e Noite" distData={db?.dist_periodo?.data} colors={periodoColors} darkMode={darkMode} />
            <DonutChart title="Ação Recomendada" subtitle="Tipo de intervenção" distData={db?.dist_acao?.data} colors={acaoColors} darkMode={darkMode} />
          </div>

          {/* Bar charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <BarChart title="Dia da Semana" subtitle="Ocorrências por dia" distData={db?.dist_dow?.data} color={cBlue} darkMode={darkMode} height="280px" />
            <BarChart title="Mês" subtitle="Distribuição mensal" distData={db?.dist_month?.data} color={cRed} darkMode={darkMode} height="280px" />
          </div>

          {/* Categoria split (comparativo only) */}
          {isComp && db?.dist_categoria?.data?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <DonutChart title="Categoria (Fonte)" subtitle="Segurança vs Telemetria" distData={db.dist_categoria.data} colors={[cRed, cBlue]} darkMode={darkMode} />
              <div className="bg-n-card text-n-text border-4 border-n-border neo-shadow p-4 sm:p-6 flex flex-col justify-center items-center">
                <div className="text-center space-y-4">
                  {db.dist_categoria.data.map((d, i) => {
                    const total = db.dist_categoria.data.reduce((s, x) => s + x.count, 0);
                    const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                    return (
                      <div key={d.label} className="flex items-center gap-4">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${i === 0 ? "bg-n-red" : "bg-n-blue"} text-n-on border-4 border-n-border flex items-center justify-center neo-shadow-sm`}>
                          {i === 0 ? <ShieldIcon /> : <ActivityIcon />}
                        </div>
                        <div className="text-left">
                          <p className="font-black uppercase text-sm sm:text-lg">{d.label}</p>
                          <p className="font-bold text-n-muted text-xs">{d.count.toLocaleString()} registros ({pct}%)</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Ranking + Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-n-yellow text-black border-4 border-n-border neo-shadow p-4 sm:p-6 flex flex-col lg:col-span-1">
              <div className="mb-4 sm:mb-6 border-b-4 border-n-border pb-2 sm:pb-4">
                <h3 className="font-display font-black text-xl sm:text-2xl uppercase">Ranking Crítico</h3>
                <p className="font-bold uppercase text-[10px] sm:text-sm mt-1 opacity-80">Maior inatividade total</p>
              </div>
              <div className="flex-1 space-y-3 sm:space-y-4">
                {ranking.map((item) => {
                  const hasSec = item.sources.includes("security");
                  const hasTel = item.sources.includes("telemetry");
                  return (
                    <div key={item.placa} className="bg-n-card text-n-text border-2 border-n-border p-2 sm:p-3 neo-shadow-sm">
                      <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                        <span className="font-black uppercase text-xs sm:text-sm truncate mr-2">#{item.rank} {item.placa}</span>
                        <span className="font-bold text-[10px] sm:text-xs bg-n-inv-bg text-n-inv-text px-2 py-0.5 sm:py-1 whitespace-nowrap">{item.total_delay_formatted}</span>
                      </div>
                      <div className="h-2 sm:h-3 w-full bg-n-bg border-2 border-n-border flex">
                        {hasSec && <div style={{ width: hasTel ? `${item.pct / 2}%` : `${item.pct}%` }} className="h-full bg-n-red border-r-2 border-n-border last:border-r-0" />}
                        {hasTel && <div style={{ width: hasSec ? `${item.pct / 2}%` : `${item.pct}%` }} className="h-full bg-n-blue" />}
                      </div>
                      <div className="flex gap-2 mt-1.5 text-[9px] sm:text-[10px] font-bold text-n-muted">
                        <span>Reinc: {item.max_reincidencia}x</span>
                        <span>Score: {item.avg_score}</span>
                      </div>
                    </div>
                  );
                })}
                {ranking.length === 0 && (
                  <div className="font-bold text-xs sm:text-sm text-center py-4 border-2 border-n-border border-dashed bg-n-card text-n-muted">Sem dados para ranking</div>
                )}
              </div>
            </div>

            <div className="bg-n-card text-n-text border-4 border-n-border neo-shadow overflow-hidden flex flex-col lg:col-span-2">
              <div className="flex gap-4 p-3 sm:p-4 border-b-4 border-n-border bg-n-inv-bg text-n-inv-text items-center">
                <span className="font-black uppercase flex-1 text-sm sm:text-lg">Visão Analítica Completa</span>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead>
                    <tr className="bg-n-bg text-n-text text-[10px] sm:text-xs uppercase tracking-wider">
                      <th className="p-3 sm:p-4 font-black border-r-4 border-b-4 border-n-border whitespace-nowrap">Placa</th>
                      <th className="p-3 sm:p-4 font-black border-r-4 border-b-4 border-n-border whitespace-nowrap">Origem</th>
                      <th className="p-3 sm:p-4 font-black border-r-4 border-b-4 border-n-border text-center whitespace-nowrap">Freq.</th>
                      <th className="p-3 sm:p-4 font-black border-r-4 border-b-4 border-n-border whitespace-nowrap">Status</th>
                      <th className="p-3 sm:p-4 font-black border-r-4 border-b-4 border-n-border whitespace-nowrap">Risco</th>
                      <th className="p-3 sm:p-4 font-black border-r-4 border-b-4 border-n-border whitespace-nowrap">Ação</th>
                      <th className="p-3 sm:p-4 font-black border-r-4 border-b-4 border-n-border text-center whitespace-nowrap">Reinc.</th>
                      <th className="p-3 sm:p-4 font-black border-b-4 border-n-border text-right whitespace-nowrap">Inat. Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs sm:text-sm font-bold text-n-text">
                    {(db?.table?.rows || []).map((row) => (
                      <tr key={row.placa} className="border-b-4 border-n-border hover:bg-n-yellow hover:text-black transition-colors cursor-pointer last:border-b-0">
                        <td className="p-3 sm:p-4 border-r-4 border-n-border font-black text-sm sm:text-lg whitespace-nowrap">{row.placa}</td>
                        <td className="p-3 sm:p-4 border-r-4 border-n-border">
                          <div className="flex flex-wrap gap-1">
                            {row.sources.includes("security") && <span className="bg-n-red text-n-on px-1.5 py-0.5 border-2 border-n-border text-[10px] font-black">SEG</span>}
                            {row.sources.includes("telemetry") && <span className="bg-n-blue text-n-on px-1.5 py-0.5 border-2 border-n-border text-[10px] font-black">TEL</span>}
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 border-r-4 border-n-border text-center font-black">{row.count}x</td>
                        <td className="p-3 sm:p-4 border-r-4 border-n-border"><span className={`${getStatusBadge(row.status)} px-1.5 py-0.5 border-2 border-n-border text-[10px] font-black`}>{row.status}</span></td>
                        <td className="p-3 sm:p-4 border-r-4 border-n-border"><span className={`${getRiscoBadge(row.risco)} px-1.5 py-0.5 border-2 border-n-border text-[10px] font-black`}>{row.risco}</span></td>
                        <td className="p-3 sm:p-4 border-r-4 border-n-border text-[10px] sm:text-xs font-black uppercase">{row.acao}</td>
                        <td className="p-3 sm:p-4 border-r-4 border-n-border text-center font-black">{row.reincidencia}x</td>
                        <td className="p-3 sm:p-4 text-right font-black text-sm sm:text-lg whitespace-nowrap">{row.total_delay_formatted}</td>
                      </tr>
                    ))}
                    {(!db?.table?.rows || db.table.rows.length === 0) && (
                      <tr><td colSpan="8" className="p-4 sm:p-6 text-center font-bold text-n-muted uppercase text-xs sm:text-sm">Nenhum dado processado</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Subcomponents ── */

function KpiCard({ label, value, sub, variant, labelVariant }) {
  const variantClasses = {
    red: "bg-n-red text-n-on",
    blue: "bg-n-blue text-n-on",
    inv: "bg-n-inv-bg text-n-inv-text",
  };
  const labelBg = {
    red: "bg-n-card text-n-text border-2 border-n-border",
    blue: "bg-n-card text-n-text border-2 border-n-border",
    inv: "",
  };
  const bg = variant ? variantClasses[variant] : "bg-n-card text-n-text";
  const lbl = variant ? (labelBg[variant] || "") : "bg-n-inv-bg text-n-inv-text";
  const lblOverride = labelVariant ? `bg-n-${labelVariant} text-n-on border-2 border-n-border` : lbl;

  return (
    <div className={`border-4 border-n-border neo-shadow p-4 sm:p-6 flex flex-col justify-between ${bg}`}>
      <p className={`font-black text-[10px] sm:text-xs uppercase inline-block px-2 py-1 w-max mb-2 sm:mb-4 ${lblOverride}`}>{label}</p>
      <h3 className="font-display font-black text-4xl sm:text-5xl tracking-tighter">{value}</h3>
      <p className={`font-bold text-xs sm:text-sm mt-1 sm:mt-2 uppercase ${variant ? "opacity-80" : "text-n-muted"}`}>{sub}</p>
    </div>
  );
}

function MetricCard({ icon, iconBg, label, value }) {
  return (
    <div className="bg-n-card border-4 border-n-border neo-shadow p-4 sm:p-6 text-n-text flex items-center gap-4">
      <div className={`w-12 h-12 sm:w-14 sm:h-14 ${iconBg} text-n-on border-4 border-n-border flex items-center justify-center flex-shrink-0 neo-shadow-sm`}>{icon}</div>
      <div>
        <p className="font-black text-[10px] sm:text-xs uppercase text-n-muted">{label}</p>
        <h3 className="font-display font-black text-2xl sm:text-3xl tracking-tighter">{value}</h3>
      </div>
    </div>
  );
}
