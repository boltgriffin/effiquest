import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Tabs } from '@/components/ui/Tabs';

export interface PrePostRow {
  id: string;
  label: string;
  baseline: number;
  post: number;
}

const series = [
  { key: 'baseline', name: 'Baseline', color: 'var(--chart-1)' },
  { key: 'post', name: 'Post', color: 'var(--chart-2)' },
] as const;

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-rule bg-surface px-3 py-2 text-sm shadow-pop">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm" style={{ background: p.color }} />
          <span className="text-muted">{p.name}</span>
          <span className="num ml-auto pl-4">{p.value}%</span>
        </p>
      ))}
    </div>
  );
}

/**
 * Baseline vs post score per misconception. Two validated categorical colors (chart-1/chart-2),
 * legend always shown, hover tooltip, and a table view for non-visual access.
 */
export function PrePostChart({ rows }: { rows: PrePostRow[] }) {
  const legend = (
    <ul className="flex gap-4 text-sm" aria-label="Legend">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-2">
          <span className="size-3 rounded-sm" style={{ background: s.color }} />
          {s.name}
        </li>
      ))}
    </ul>
  );

  const chart = (
    <div className="flex flex-col gap-3">
      {legend}
      <div className="h-80 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
            barGap={2}
            barCategoryGap="28%"
          >
            <CartesianGrid horizontal={false} stroke="var(--rule)" />
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--rule-strong)' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={140}
              tick={{ fill: 'var(--ink)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color}
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const table = (
    <table className="w-full text-sm">
      <caption className="sr-only">Baseline and post scores per misconception</caption>
      <thead>
        <tr className="border-b border-rule text-left text-muted">
          <th scope="col" className="py-2 font-medium">
            Misconception
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            Baseline
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            Post
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            Change
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-rule">
        {rows.map((r) => (
          <tr key={r.id}>
            <th scope="row" className="py-2 text-left font-normal">
              {r.label}
            </th>
            <td className="num py-2 text-right">{r.baseline}%</td>
            <td className="num py-2 text-right">{r.post}%</td>
            <td className="num py-2 text-right">
              {r.post - r.baseline > 0 ? '+' : ''}
              {r.post - r.baseline}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Tabs
      label="Baseline versus post view"
      items={[
        { id: 'chart', label: 'Chart', icon: 'progress', content: chart },
        { id: 'table', label: 'Table', icon: 'layers', content: table },
      ]}
    />
  );
}
