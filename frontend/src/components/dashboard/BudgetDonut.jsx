import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../ui/Card';
import { useProjectStore } from '../../store/projectStore';
import api from '../../api';

export default function BudgetDonut() {
  const activeId = useProjectStore((s) => s.activeProjectId);
  const { data: project } = useQuery({
    queryKey: ['project', activeId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${activeId}/`);
      return data;
    },
    enabled: !!activeId,
  });

  const spent = project?.budgetSpent ?? 0;
  const total = project?.budgetTotal ?? 1;
  const remaining = Math.max(total - spent, 0);
  const data = [
    { name: 'Spent', value: spent, color: '#f59e0b' },
    { name: 'Remaining', value: remaining, color: '#27272a' },
  ];
  const pct = total ? Math.round((spent / total) * 100) : 0;

  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-300">Budget Spent vs Total</h3>
      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={55} outerRadius={75} paddingAngle={2} stroke="none">
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
              formatter={(v) => `Rs ${Number(v).toLocaleString('en-IN')}`}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-amber-400">{pct}%</p>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">used</p>
        </div>
      </div>
      <div className="mt-3 flex justify-between text-xs text-zinc-400">
        <span>Rs {(spent / 100000).toFixed(1)}L spent</span>
        <span>Rs {(remaining / 100000).toFixed(1)}L left</span>
      </div>
    </Card>
  );
}