"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { BudgetCategory, BudgetItem } from "@prisma/client";

type BudgetCategoryWithItems = BudgetCategory & { items: BudgetItem[] };

interface BudgetChartsProps {
  categories: BudgetCategoryWithItems[];
}

interface TooltipPayload {
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

function DonutTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-gray-900">{payload[0].name}</p>
      <p className="text-gray-500">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function BarTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm text-xs space-y-0.5">
      {payload.map((p, i) => (
        <p key={i} className="text-gray-700">
          <span className="text-gray-400">{p.name === "estimated" ? "Estimated: " : "Paid: "}</span>
          {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

function xAxisTickFormatter(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
  return `$${v}`;
}

export default function BudgetCharts({ categories }: BudgetChartsProps) {
  const chartData = categories
    .map((cat) => ({
      name: cat.name,
      color: cat.color,
      estimated: cat.items.reduce((s, i) => s + i.estimatedCost, 0),
      paid: cat.items.reduce((s, i) => s + i.amountPaid, 0),
    }))
    .filter((d) => d.estimated > 0);

  if (chartData.length === 0) return null;

  const totalEstimated = chartData.reduce((s, d) => s + d.estimated, 0);

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Donut: budget by category */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-apple-sm p-4">
        <p className="text-xs font-medium text-gray-400 mb-1">Budget by Category</p>
        <div className="relative">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={90}
                paddingAngle={2}
                dataKey="estimated"
                nameKey="name"
                strokeWidth={0}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Estimated</p>
            <p className="text-base font-semibold text-gray-900">{formatCurrency(totalEstimated)}</p>
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
          {chartData.map((d, i) => (
            <span key={i} className="flex items-center gap-1 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              {d.name}
            </span>
          ))}
        </div>
      </div>

      {/* Horizontal bar: estimated vs paid per category */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-apple-sm p-4">
        <p className="text-xs font-medium text-gray-400 mb-1">Estimated vs. Paid</p>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
            barCategoryGap="30%"
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis
              type="number"
              tickFormatter={xAxisTickFormatter}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={78}
              tick={{ fontSize: 10, fill: "#6b7280" }}
              tickFormatter={(v: string) => (v.length > 11 ? v.slice(0, 11) + "…" : v)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<BarTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="estimated" name="estimated" fill="#e5e7eb" radius={[0, 3, 3, 0]} />
            <Bar dataKey="paid" name="paid" fill="#10b981" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-1">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-sm bg-gray-200 shrink-0" />
            Estimated
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
            Paid
          </span>
        </div>
      </div>
    </div>
  );
}
