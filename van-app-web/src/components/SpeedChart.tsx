"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { LocationPoint } from "@/services/tripService";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

interface Props {
  locations: LocationPoint[];
}

export default function SpeedChart({ locations }: Props) {
  // Filtre les points qui ont une vitesse > 0
  const withSpeed = locations.filter(l => l.speed != null && l.speed > 0);

  if (withSpeed.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-500">
        <span className="text-3xl mb-2">📉</span>
        <p className="text-sm">Pas assez de données de vitesse.</p>
      </div>
    );
  }

  const labels = withSpeed.map(l =>
    new Date(l.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
  const speeds = withSpeed.map(l => Math.round((l.speed ?? 0) * 3.6)); // m/s → km/h
  const maxSpeed = Math.max(...speeds);

  const data = {
    labels,
    datasets: [
      {
        label: "Vitesse (km/h)",
        data: speeds,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.15)",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: "#6366f1",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e1e2e",
        borderColor: "#6366f1",
        borderWidth: 1,
        titleColor: "#94a3b8",
        bodyColor: "#fff",
        callbacks: {
          label: (ctx: any) => ` ${ctx.parsed.y} km/h`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#64748b",
          maxTicksLimit: 6,
          font: { size: 10 },
        },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
      y: {
        ticks: {
          color: "#64748b",
          font: { size: 10 },
          callback: (v: any) => `${v} km/h`,
        },
        grid: { color: "rgba(255,255,255,0.04)" },
        min: 0,
        max: Math.ceil(maxSpeed * 1.2 / 10) * 10,
      },
    },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Vitesse au fil du temps</span>
        <span className="text-xs font-bold text-indigo-400">Max : {maxSpeed} km/h</span>
      </div>
      <div style={{ height: "140px" }}>
        <Line data={data} options={options as any} />
      </div>
    </div>
  );
}
