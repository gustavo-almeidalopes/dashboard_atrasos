import { useRef, useEffect } from "react";
import { Chart, registerables } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

Chart.register(...registerables, ChartDataLabels);
Chart.defaults.font.family = "'Space Grotesk', sans-serif";
Chart.defaults.font.weight = "bold";

export function ChartView({ type, data, options, height = "280px" }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) chartRef.current.destroy();
    const ctx = canvasRef.current.getContext("2d");
    chartRef.current = new Chart(ctx, { type, data, options });
    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [data, options, type]);

  return (
    <div style={{ height, position: "relative", width: "100%" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

export function DonutChart({ title, subtitle, distData, colors, darkMode, height = "260px" }) {
  const cText = darkMode ? "#F5F5F0" : "#000000";
  const cBorder = darkMode ? "#262626" : "#ffffff";

  if (!distData || distData.length === 0) return null;
  const total = distData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-n-card text-n-text border-4 border-n-border neo-shadow p-4 sm:p-6 flex flex-col">
      <div className="mb-3 sm:mb-4 border-b-4 border-n-border pb-2 sm:pb-3">
        <h3 className="font-display font-black text-sm sm:text-lg uppercase">{title}</h3>
        {subtitle && <p className="font-bold text-n-muted uppercase text-[10px] sm:text-xs mt-1">{subtitle}</p>}
      </div>
      <div className="flex-1">
        <ChartView
          type="doughnut"
          height={height}
          data={{
            labels: distData.map((d) => d.label),
            datasets: [{
              data: distData.map((d) => d.count),
              backgroundColor: colors.slice(0, distData.length),
              borderColor: cBorder,
              borderWidth: 3,
              hoverOffset: 8,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: "62%",
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  font: { family: "'Space Grotesk'", size: window.innerWidth < 768 ? 10 : 12, weight: "bold" },
                  color: cText,
                  padding: 12,
                  boxWidth: 14,
                  boxHeight: 14,
                },
              },
              datalabels: {
                color: "#fff",
                font: { family: "'Space Grotesk'", weight: "900", size: window.innerWidth < 768 ? 11 : 14 },
                formatter: (v) => (total > 0 ? `${Math.round((v / total) * 100)}%` : "0%"),
              },
              tooltip: {
                backgroundColor: darkMode ? "#1a1a1a" : "#000",
                padding: 12,
                titleFont: { family: "Space Grotesk", size: 14 },
                bodyFont: { family: "Inter", size: 13 },
                cornerRadius: 0,
                borderColor: darkMode ? "#DDF000" : "#F0FE00",
                borderWidth: 3,
              },
            },
          }}
        />
      </div>
    </div>
  );
}

export function BarChart({ title, subtitle, distData, color, darkMode, height = "260px", horizontal = false }) {
  const cText = darkMode ? "#F5F5F0" : "#000";
  const cGrid = "#000";

  if (!distData || distData.length === 0) return null;
  const axis = horizontal ? "y" : "x";

  return (
    <div className="bg-n-card text-n-text border-4 border-n-border neo-shadow p-4 sm:p-6 flex flex-col">
      <div className="mb-3 sm:mb-4 border-b-4 border-n-border pb-2 sm:pb-3">
        <h3 className="font-display font-black text-sm sm:text-lg uppercase">{title}</h3>
        {subtitle && <p className="font-bold text-n-muted uppercase text-[10px] sm:text-xs mt-1">{subtitle}</p>}
      </div>
      <div className="flex-1">
        <ChartView
          type="bar"
          height={height}
          data={{
            labels: distData.map((d) => d.label),
            datasets: [{
              data: distData.map((d) => d.count),
              backgroundColor: color,
              borderColor: cGrid,
              borderWidth: 2,
              borderRadius: 0,
            }],
          }}
          options={{
            indexAxis: axis,
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: horizontal ? 4 : 32 } },
            plugins: {
              legend: { display: false },
              datalabels: {
                display: !horizontal,
                anchor: "end",
                align: "end",
                offset: 4,
                color: cText,
                font: { family: "'Space Grotesk'", weight: "bold", size: window.innerWidth < 768 ? 10 : 12 },
              },
              tooltip: {
                backgroundColor: darkMode ? "#1a1a1a" : "#000",
                padding: 12,
                cornerRadius: 0,
                borderColor: darkMode ? "#DDF000" : "#F0FE00",
                borderWidth: 3,
              },
            },
            scales: {
              x: {
                grid: { color: darkMode ? "rgba(0,0,0,.5)" : "rgba(0,0,0,.1)", lineWidth: 1 },
                ticks: { color: cText, font: { weight: "bold", size: window.innerWidth < 768 ? 9 : 11 } },
                border: { width: 2, color: cGrid },
              },
              y: {
                grid: { color: darkMode ? "rgba(0,0,0,.5)" : "rgba(0,0,0,.1)", lineWidth: 1 },
                ticks: { color: cText, font: { weight: "bold", size: window.innerWidth < 768 ? 9 : 11 } },
                beginAtZero: true,
                border: { width: 2, color: cGrid },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
