'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import styled from 'styled-components';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  PieChart as PieChartIcon,
  Clock3,
  AlertTriangle,
  CheckCircle,
  Timer,
  Coffee,
  ArrowDownRight,
  Target,
} from 'lucide-react';

export const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
`;

export const KpiCard = styled.div`
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: ${(props) => props.theme.shadows.sm};
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  .label {
    font-size: 0.725rem;
    font-weight: 600;
    color: ${(props) => props.theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${(props) => props.theme.colors.text};
  }

  .sub {
    font-size: 0.725rem;
    color: ${(props) => props.theme.colors.textMuted};
  }
`;

export const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const ChartBox = styled.div`
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: 1.5rem;
  box-shadow: ${(props) => props.theme.shadows.sm};
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const ChartTitle = styled.h4`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

export const ChartSubtitle = styled.span`
  font-size: 0.725rem;
  color: ${(props) => props.theme.colors.textMuted};
  display: block;
  margin-top: -0.75rem;
  margin-bottom: 0.5rem;
`;

const PIE_COLORS = ['#10b981', '#ef4444', '#6366f1', '#f59e0b', '#ec4899', '#14b8a6'];

interface ReportsDashboardProps {
  userId: string;
  startDate: string;
  endDate: string;
}

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ userId, startDate, endDate }) => {
  const { data: reportData, isLoading } = useQuery<any>({
    queryKey: ['workloadReportsDashboard', userId, startDate, endDate],
    queryFn: async () => {
      let url = '/api/reports/work-hours?';
      if (userId) url += `userId=${userId}&`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      const res = await axios.get(url);
      return res.data;
    },
  });

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Carregando dados da jornada...</div>;
  }

  const records = reportData?.records || [];
  const kpisData = reportData?.kpis || {
    totalExpected: 0,
    totalWorked: 0,
    diff: 0,
    totalBank: 0,
    totalUsed: 0,
    totalExtra: 0,
    topBalanceUser: { name: '-', hours: 0 },
    topExtraUser: { name: '-', hours: 0 },
    delayCount: 0,
    earlyOutCount: 0,
    completedCount: 0,
    avgDelayMinutes: 0,
    avgExtraOutMinutes: 0,
    avgBreakMinutes: 0,
    fulfillmentPercentage: 100,
  };

  // 1. Expected vs Worked Hours (Line)
  const dateMap = new Map<string, { expected: number; worked: number }>();
  for (const r of [...records].reverse()) {
    const dateStr = new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const current = dateMap.get(dateStr) || { expected: 0, worked: 0 };
    dateMap.set(dateStr, {
      expected: current.expected + (r.expected / 60),
      worked: current.worked + (r.worked / 60),
    });
  }
  const expectedVsWorkedData = Array.from(dateMap.entries()).map(([date, val]) => ({
    date,
    Previsto: parseFloat(val.expected.toFixed(1)),
    Realizado: parseFloat(val.worked.toFixed(1)),
  }));

  // 2. Overtime hours per employee (Bar)
  const extraMap = new Map<string, number>();
  for (const r of records) {
    extraMap.set(r.userName, (extraMap.get(r.userName) || 0) + (r.extra / 60));
  }
  const extraPerUser = Array.from(extraMap.entries()).map(([name, hours]) => ({
    name,
    Horas: parseFloat(hours.toFixed(1)),
  })).sort((a, b) => b.Horas - a.Horas);

  // 3. Distribution (Pie: Normal, Extra, Banco, Deficit)
  let sumNormal = 0;
  let sumExtra = 0;
  let sumBank = 0;
  let sumDeficit = 0;
  for (const r of records) {
    sumNormal += r.normal / 60;
    sumExtra += r.extra / 60;
    sumBank += r.bank / 60;
    sumDeficit += r.deficit / 60;
  }
  const distributionData = [
    { name: 'Horas Normais', value: parseFloat(sumNormal.toFixed(1)) },
    { name: 'Horas Extras', value: parseFloat(sumExtra.toFixed(1)) },
    { name: 'Banco de Horas', value: parseFloat(sumBank.toFixed(1)) },
    { name: 'Déficit (Pendentes)', value: parseFloat(sumDeficit.toFixed(1)) },
  ].filter(d => d.value > 0);

  // 4. Weekly fulfillment (Stacked Bar)
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };
  const weekMap = new Map<string, { expected: number; normal: number; extra: number; used: number }>();
  for (const r of [...records].reverse()) {
    const d = new Date(r.date);
    const weekStr = `Semana ${getWeekNumber(d)}`;
    const current = weekMap.get(weekStr) || { expected: 0, normal: 0, extra: 0, used: 0 };
    weekMap.set(weekStr, {
      expected: current.expected + (r.expected / 60),
      normal: current.normal + (r.normal / 60),
      extra: current.extra + (r.extra / 60),
      used: current.used + (r.used / 60),
    });
  }
  const weeklyFulfillment = Array.from(weekMap.entries()).map(([week, val]) => ({
    week,
    Previsto: parseFloat(val.expected.toFixed(1)),
    Normais: parseFloat(val.normal.toFixed(1)),
    Extras: parseFloat(val.extra.toFixed(1)),
    Compensado: parseFloat(val.used.toFixed(1)),
  }));

  // 5. Cumulative bank hours evolution (Area)
  let accumBank = 0;
  const bankEvolutionData = [...records].reverse().map((r) => {
    const delta = (r.bank - r.used) / 60;
    accumBank += delta;
    return {
      date: new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      Saldo: parseFloat(accumBank.toFixed(1)),
    };
  });

  // 6. Delays per day (Bar)
  const delayDateMap = new Map<string, number>();
  for (const r of [...records].reverse()) {
    if (r.delayInMinutes > 0) {
      const dateStr = new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      delayDateMap.set(dateStr, (delayDateMap.get(dateStr) || 0) + r.delayInMinutes);
    }
  }
  const delaysPerDay = Array.from(delayDateMap.entries()).map(([date, minutes]) => ({
    date,
    Minutos: minutes,
  }));

  // 7. Early departures per day (Bar)
  const earlyOutDateMap = new Map<string, number>();
  for (const r of [...records].reverse()) {
    if (r.earlyOutMinutes > 0) {
      const dateStr = new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      earlyOutDateMap.set(dateStr, (earlyOutDateMap.get(dateStr) || 0) + r.earlyOutMinutes);
    }
  }
  const earlyOutsPerDay = Array.from(earlyOutDateMap.entries()).map(([date, minutes]) => ({
    date,
    Minutos: minutes,
  }));

  // 8. Avg entry time per day (Line)
  const entryTimeDateMap = new Map<string, { sum: number; count: number }>();
  for (const r of [...records].reverse()) {
    const d = new Date(r.clockIn);
    const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const minutesSinceMidnight = d.getHours() * 60 + d.getMinutes();
    const current = entryTimeDateMap.get(dateStr) || { sum: 0, count: 0 };
    entryTimeDateMap.set(dateStr, { sum: current.sum + minutesSinceMidnight, count: current.count + 1 });
  }
  const avgEntryTimeData = Array.from(entryTimeDateMap.entries()).map(([date, val]) => {
    const avgMins = Math.round(val.sum / val.count);
    const hrs = Math.floor(avgMins / 60);
    const mins = avgMins % 60;
    return {
      date,
      Horario: parseFloat((avgMins / 60).toFixed(2)),
      label: `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`,
    };
  });

  // 9. Avg exit time per day (Line)
  const exitTimeDateMap = new Map<string, { sum: number; count: number }>();
  for (const r of [...records].reverse()) {
    if (r.clockOut) {
      const d = new Date(r.clockOut);
      const dateStr = new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const minutesSinceMidnight = d.getHours() * 60 + d.getMinutes();
      const current = exitTimeDateMap.get(dateStr) || { sum: 0, count: 0 };
      exitTimeDateMap.set(dateStr, { sum: current.sum + minutesSinceMidnight, count: current.count + 1 });
    }
  }
  const avgExitTimeData = Array.from(exitTimeDateMap.entries()).map(([date, val]) => {
    const avgMins = Math.round(val.sum / val.count);
    const hrs = Math.floor(avgMins / 60);
    const mins = avgMins % 60;
    return {
      date,
      Horario: parseFloat((avgMins / 60).toFixed(2)),
      label: `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`,
    };
  });

  // 10. Break distribution (Pie)
  let totalBreakMinutes = 0;
  let totalPlannedBreakMinutes = 0;
  for (const r of records) {
    totalBreakMinutes += r.actualBreakMinutes || 0;
    totalPlannedBreakMinutes += r.plannedBreakMinutes || 0;
  }
  const breakDistribution = [
    { name: 'Pausas Realizadas', value: parseFloat((totalBreakMinutes / 60).toFixed(1)) },
    { name: 'Pausas Previstas', value: parseFloat((totalPlannedBreakMinutes / 60).toFixed(1)) },
  ].filter(d => d.value > 0);

  const kpis = [
    { label: 'Jornada Prevista', value: `${kpisData.totalExpected}h`, sub: 'Horas planejadas em escala' },
    { label: 'Jornada Realizada', value: `${kpisData.totalWorked}h`, sub: 'Horas efetivas trabalhadas' },
    { label: 'Diferença Líquida', value: `${kpisData.diff >= 0 ? '+' : ''}${kpisData.diff}h`, sub: 'Saldo geral previsto vs. realizado' },
    { label: 'Cumprimento', value: `${kpisData.fulfillmentPercentage}%`, sub: 'Percentual da jornada cumprida' },
    { label: 'Atrasos', value: `${kpisData.delayCount}`, sub: `Média: ${kpisData.avgDelayMinutes} min por atraso` },
    { label: 'Saídas Antecipadas', value: `${kpisData.earlyOutCount}`, sub: 'Saídas antes do expediente' },
    { label: 'Jornadas Completas', value: `${kpisData.completedCount}`, sub: 'Dias sem déficit de horas' },
    { label: 'Permanência Extra', value: `${kpisData.avgExtraOutMinutes} min`, sub: 'Média de permanência após expediente' },
    { label: 'Tempo Médio Pausa', value: `${kpisData.avgBreakMinutes} min`, sub: 'Média de pausas por registro' },
    { label: 'Acumulado Banco', value: `${kpisData.totalBank}h`, sub: 'Horas enviadas para o banco' },
    { label: 'Compensado Banco', value: `${kpisData.totalUsed}h`, sub: 'Déficits cobertos usando banco' },
    { label: 'Total Horas Extras', value: `${kpisData.totalExtra}h`, sub: 'Horas extras remuneradas' },
  ];

  return (
    <div>
      <DashboardGrid>
        {kpis.map((kpi, idx) => (
          <KpiCard key={idx}>
            <span className="label">{kpi.label}</span>
            <span className="value" style={{
              color: kpi.label === 'Diferença Líquida'
                ? (kpisData.diff >= 0 ? '#10b981' : '#ef4444')
                : kpi.label === 'Cumprimento'
                  ? (kpisData.fulfillmentPercentage >= 90 ? '#10b981' : kpisData.fulfillmentPercentage >= 70 ? '#f59e0b' : '#ef4444')
                  : undefined
            }}>{kpi.value}</span>
            <span className="sub">{kpi.sub}</span>
          </KpiCard>
        ))}
      </DashboardGrid>

      <ChartsGrid>
        {/* Expected vs Worked (Line) */}
        <ChartBox>
          <ChartTitle><TrendingUp size={16} /> Jornada Prevista vs. Realizada</ChartTitle>
          <ChartSubtitle>Comparativo diário de horas estimadas e horas efetivamente cumpridas</ChartSubtitle>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={expectedVsWorkedData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#94a3b8" tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="Previsto" stroke="#6366f1" strokeWidth={2} />
                <Line type="monotone" dataKey="Realizado" stroke="#10b981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>

        {/* Overtime by User (Bar) */}
        <ChartBox>
          <ChartTitle><BarChart3 size={16} /> Horas Extras por Colaborador</ChartTitle>
          <ChartSubtitle>Total acumulado de horas extras apuradas no período selecionado</ChartSubtitle>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={extraPerUser} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#94a3b8" tickLine={false} />
                <Tooltip />
                <Bar dataKey="Horas" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>

        {/* Avg Entry Time (Line) */}
        <ChartBox>
          <ChartTitle><Clock3 size={16} /> Horário Médio de Entrada</ChartTitle>
          <ChartSubtitle>Evolução do horário médio de entrada dos colaboradores por dia</ChartSubtitle>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={avgEntryTimeData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#94a3b8" tickLine={false} domain={[6, 12]} tickFormatter={(v: number) => `${Math.floor(v)}h`} />
                <Tooltip formatter={(value: any) => {
                  const v = Number(value) || 0;
                  const h = Math.floor(v);
                  const m = Math.round((v - h) * 60);
                  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                }} />
                <Line type="monotone" dataKey="Horario" stroke="#3b82f6" strokeWidth={2} name="Horário" dot={{ fill: '#3b82f6', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>

        {/* Avg Exit Time (Line) */}
        <ChartBox>
          <ChartTitle><Clock3 size={16} /> Horário Médio de Saída</ChartTitle>
          <ChartSubtitle>Evolução do horário médio de saída dos colaboradores por dia</ChartSubtitle>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={avgExitTimeData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#94a3b8" tickLine={false} domain={[14, 20]} tickFormatter={(v: number) => `${Math.floor(v)}h`} />
                <Tooltip formatter={(value: any) => {
                  const v = Number(value) || 0;
                  const h = Math.floor(v);
                  const m = Math.round((v - h) * 60);
                  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                }} />
                <Line type="monotone" dataKey="Horario" stroke="#8b5cf6" strokeWidth={2} name="Horário" dot={{ fill: '#8b5cf6', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>

        {/* Delays per Day (Bar) */}
        <ChartBox>
          <ChartTitle><AlertTriangle size={16} /> Atrasos por Dia</ChartTitle>
          <ChartSubtitle>Minutos de atraso acumulados por dia no período selecionado</ChartSubtitle>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={delaysPerDay} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#94a3b8" tickLine={false} />
                <Tooltip />
                <Bar dataKey="Minutos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Atraso (min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>

        {/* Early Departures per Day (Bar) */}
        <ChartBox>
          <ChartTitle><ArrowDownRight size={16} /> Saídas Antecipadas por Dia</ChartTitle>
          <ChartSubtitle>Minutos de saída antecipada acumulados por dia</ChartSubtitle>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={earlyOutsPerDay} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#94a3b8" tickLine={false} />
                <Tooltip />
                <Bar dataKey="Minutos" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Saída antecipada (min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>

        {/* Weekly Stacked Fulfillment (Bar) */}
        <ChartBox>
          <ChartTitle><Target size={16} /> Cumprimento da Jornada Semanal</ChartTitle>
          <ChartSubtitle>Divisão das horas realizadas (regulares, extras, compensadas) vs. previstas</ChartSubtitle>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={weeklyFulfillment} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week" stroke="#94a3b8" tickLine={false} style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#94a3b8" tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="Normais" stackId="a" fill="#10b981" />
                <Bar dataKey="Extras" stackId="a" fill="#ec4899" />
                <Bar dataKey="Compensado" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Previsto" fill="#6366f1" opacity={0.6} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>

        {/* Distribution (Pie) */}
        <ChartBox>
          <ChartTitle><PieChartIcon size={16} /> Distribuição de Horas Acumuladas</ChartTitle>
          <ChartSubtitle>Participação relativa de horas normais, extras, banco e déficit pendente</ChartSubtitle>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>

        {/* Pause Distribution (Pie) */}
        {breakDistribution.length > 0 && (
          <ChartBox>
            <ChartTitle><Coffee size={16} /> Distribuição das Pausas</ChartTitle>
            <ChartSubtitle>Comparação entre tempo planejado e tempo efetivo de pausas/intervalos</ChartSubtitle>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={breakDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {breakDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-brk-${index}`} fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartBox>
        )}

        {/* Cumulative Bank Hours (Area) */}
        <ChartBox style={{ gridColumn: '1 / -1' }}>
          <ChartTitle><TrendingUp size={16} /> Evolução do Banco de Horas (Saldo Líquido)</ChartTitle>
          <ChartSubtitle>Evolução cronológica do saldo total acumulado de banco de horas (depósitos vs. deduções)</ChartSubtitle>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={bankEvolutionData} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="bankEvolutionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#94a3b8" tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="Saldo" name="Saldo (Horas)" stroke="#4f46e5" strokeWidth={2.5} fill="url(#bankEvolutionGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>
      </ChartsGrid>
    </div>
  );
};
