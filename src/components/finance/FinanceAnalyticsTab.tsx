import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  PieChart,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  AnimatedNumber,
  AnimatedProgressBar,
  MOMENTUM_EASE,
  StaggerContainer,
  StaggerItem,
} from '../common/MotionPrimitives';
import { GlassSegmentedControl } from '../common/LiquidGlass';
import {
  computeBudgetProgress,
  computeCategoryBreakdown,
  computeMonthlySeries,
  formatCurrency,
  getMonthKey,
} from '../../lib/finance';
import type {
  CurrencyCode,
  FinanceBudget,
  FinanceCategory,
  FinanceTransaction,
} from '../../types/finance';

interface Props {
  transactions: FinanceTransaction[];
  budgets: FinanceBudget[];
  categories: FinanceCategory[];
  currency: CurrencyCode;
  rangeStart?: string;
  rangeEnd?: string;
  rangeLabel: string;
}

export const FinanceAnalyticsTab: React.FC<Props> = ({
  transactions,
  budgets,
  categories,
  currency,
  rangeStart,
  rangeEnd,
  rangeLabel,
}) => {
  const [monthsWindow, setMonthsWindow] = useState<6 | 12>(6);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const monthlySeries = useMemo(
    () => computeMonthlySeries(transactions, monthsWindow),
    [transactions, monthsWindow]
  );

  const categoryBreakdown = useMemo(
    () => computeCategoryBreakdown(transactions, categories, rangeStart, rangeEnd),
    [transactions, categories, rangeStart, rangeEnd]
  );

  const currentMonth = getMonthKey(new Date());
  const prevDate = new Date();
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonth = getMonthKey(prevDate);

  const currentMonthMetrics = useMemo(() => {
    const cur = monthlySeries.find(m => m.month === currentMonth) || {
      income: 0,
      expenses: 0,
      savings: 0,
    };
    const prev = monthlySeries.find(m => m.month === prevMonth) || {
      income: 0,
      expenses: 0,
      savings: 0,
    };
    const pctDelta = (nowVal: number, oldVal: number) => {
      if (oldVal === 0) return nowVal > 0 ? 100 : 0;
      return Math.round(((nowVal - oldVal) / Math.abs(oldVal)) * 1000) / 10;
    };
    return {
      cur,
      prev,
      incomeDelta: pctDelta(cur.income, prev.income),
      expenseDelta: pctDelta(cur.expenses, prev.expenses),
      savingsDelta: pctDelta(cur.savings, prev.savings),
    };
  }, [monthlySeries, currentMonth, prevMonth]);

  const budgetPerformance = useMemo(
    () => computeBudgetProgress(budgets, transactions, currentMonth),
    [budgets, transactions, currentMonth]
  );

  const totalBudgetLimit = budgetPerformance.reduce((a, b) => a + b.limitAmount, 0);
  const totalBudgetSpent = budgetPerformance.reduce((a, b) => a + b.spent, 0);
  const budgetAdherence =
    totalBudgetLimit > 0
      ? Math.max(
          0,
          Math.round(
            ((totalBudgetLimit - Math.max(0, totalBudgetSpent - totalBudgetLimit)) /
              totalBudgetLimit) *
              100
          )
        )
      : 100;

  // Donut SVG geometry
  const totalExpenses = categoryBreakdown.reduce((acc, c) => acc + c.amount, 0);
  const donutSegments = useMemo(() => {
    const r = 56;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    return categoryBreakdown.map(item => {
      const fraction = totalExpenses > 0 ? item.amount / totalExpenses : 0;
      const length = fraction * circ;
      const seg = { ...item, dashArray: `${length} ${circ - length}`, dashOffset: -offset };
      offset += length;
      return seg;
    });
  }, [categoryBreakdown, totalExpenses]);

  // Savings Trend SVG polyline
  const savingsPath = useMemo(() => {
    if (monthlySeries.length === 0)
      return {
        points: '',
        coords: [] as { x: number; y: number; label: string; savings: number }[],
      };
    const vals = monthlySeries.map(m => m.savings);
    const minVal = Math.min(0, ...vals);
    const maxVal = Math.max(1, ...vals);
    const span = Math.max(1, maxVal - minVal);
    const width = 460;
    const height = 140;
    const padX = 20;
    const padY = 18;
    const coords = monthlySeries.map((m, idx) => {
      const x =
        monthlySeries.length === 1
          ? width / 2
          : padX + (idx / (monthlySeries.length - 1)) * (width - padX * 2);
      const y = height - padY - ((m.savings - minVal) / span) * (height - padY * 2);
      return { x, y, label: m.label, savings: m.savings };
    });
    const points = coords.map(c => `${c.x},${c.y}`).join(' ');
    return { points, coords };
  }, [monthlySeries]);

  const maxBar = Math.max(1, ...monthlySeries.flatMap(m => [m.income, m.expenses]));

  return (
    <div className="space-y-6">
      {/* Month-over-Month Financial Comparisons */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StaggerItem className="card-hover p-4 rounded-2xl bg-surface border border-line space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
            Monthly Income Comparison
          </span>
          <div className="font-mono text-lg font-extrabold text-success tabular-nums">
            <AnimatedNumber
              value={currentMonthMetrics.cur.income}
              formatter={v => formatCurrency(v, currency)}
            />
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono tabular-nums">
            {currentMonthMetrics.incomeDelta >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-success shrink-0" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-danger shrink-0" />
            )}
            <span className="text-ink-muted">
              {currentMonthMetrics.incomeDelta >= 0 ? '+' : ''}
              {currentMonthMetrics.incomeDelta}% vs last month
            </span>
          </div>
        </StaggerItem>

        <StaggerItem className="card-hover p-4 rounded-2xl bg-surface border border-line space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
            Monthly Expenses Comparison
          </span>
          <div className="font-mono text-lg font-extrabold text-danger tabular-nums">
            <AnimatedNumber
              value={currentMonthMetrics.cur.expenses}
              formatter={v => formatCurrency(v, currency)}
            />
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono tabular-nums">
            {currentMonthMetrics.expenseDelta <= 0 ? (
              <ArrowDownRight className="w-3.5 h-3.5 text-success shrink-0" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5 text-danger shrink-0" />
            )}
            <span className="text-ink-muted">
              {currentMonthMetrics.expenseDelta >= 0 ? '+' : ''}
              {currentMonthMetrics.expenseDelta}% vs last month
            </span>
          </div>
        </StaggerItem>

        <StaggerItem className="card-hover p-4 rounded-2xl bg-surface border border-line space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
            Monthly Net Savings
          </span>
          <div className="font-mono text-lg font-extrabold text-ink tabular-nums">
            <AnimatedNumber
              value={currentMonthMetrics.cur.savings}
              formatter={v => formatCurrency(v, currency)}
            />
          </div>
          <div className="text-[11px] font-mono text-ink-muted tabular-nums">
            Last month: {formatCurrency(currentMonthMetrics.prev.savings, currency)}
          </div>
        </StaggerItem>

        <StaggerItem className="card-hover p-4 rounded-2xl bg-surface border border-line space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
            Budget Adherence
          </span>
          <div className="font-mono text-lg font-extrabold text-accent tabular-nums">
            <AnimatedNumber value={budgetAdherence} formatter={v => `${Math.round(v)}%`} />
          </div>
          <div className="text-[11px] text-ink-muted tabular-nums">
            {budgetPerformance.length} active budgets this month
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Row 2: Spending by Category Donut + Top Spending Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: MOMENTUM_EASE }}
          className="lg:col-span-6 p-6 rounded-2xl bg-surface border border-line space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-line gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <PieChart className="w-4 h-4 text-brand-blue shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink truncate">
                Spending by Category ({rangeLabel})
              </h3>
            </div>
            <span className="font-mono text-xs font-bold text-ink tabular-nums shrink-0">
              {formatCurrency(totalExpenses, currency)}
            </span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-muted">
              No expenses recorded in this period to analyze by category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              <div className="sm:col-span-5 flex items-center justify-center relative">
                <svg viewBox="0 0 150 150" className="w-40 h-40 -rotate-90">
                  <circle
                    cx="75"
                    cy="75"
                    r="56"
                    fill="none"
                    stroke="var(--bg-surface-inset)"
                    strokeWidth="18"
                  />
                  {donutSegments.map(seg => (
                    <circle
                      key={seg.category}
                      cx="75"
                      cy="75"
                      r="56"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={hoveredCategory === seg.category ? '22' : '18'}
                      strokeDasharray={seg.dashArray}
                      strokeDashoffset={seg.dashOffset}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredCategory(seg.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                  <span className="text-[10px] font-mono uppercase text-ink-muted truncate max-w-[90px]">
                    {hoveredCategory || 'Total Out'}
                  </span>
                  <span className="font-mono text-xs font-extrabold text-ink tabular-nums">
                    {hoveredCategory
                      ? formatCurrency(
                          categoryBreakdown.find(c => c.category === hoveredCategory)?.amount || 0,
                          currency
                        )
                      : formatCurrency(totalExpenses, currency)}
                  </span>
                </div>
              </div>

              <div className="sm:col-span-7 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {categoryBreakdown.map(item => (
                  <div
                    key={item.category}
                    onMouseEnter={() => setHoveredCategory(item.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className="space-y-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="flex items-center gap-2 font-medium text-ink min-w-0 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate">{item.category}</span>
                      </span>
                      <span className="font-mono text-[11px] text-ink-muted tabular-nums shrink-0">
                        <strong className="text-ink">{formatCurrency(item.amount, currency)}</strong>{' '}
                        ({item.percentage}%)
                      </span>
                    </div>
                    <AnimatedProgressBar
                      percentage={item.percentage}
                      trackClassName="w-full h-1.5 bg-surface-inset rounded-full overflow-hidden"
                      fillClassName="h-full rounded-full bg-accent"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Savings Trend Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.06, ease: MOMENTUM_EASE }}
          className="lg:col-span-6 p-6 rounded-2xl bg-surface border border-line space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-line gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                Savings Trend
              </h3>
            </div>

            <GlassSegmentedControl
              layoutId="finance-analytics-window-pill"
              size="sm"
              value={String(monthsWindow)}
              onChange={id => setMonthsWindow(id === '12' ? 12 : 6)}
              options={[
                { id: '6', label: '6M' },
                { id: '12', label: '12M' },
              ]}
            />
          </div>

          {monthlySeries.every(m => m.income === 0 && m.expenses === 0) ? (
            <div className="py-12 text-center text-xs text-ink-muted">
              Log income and expenses to plot your monthly net savings trajectory.
            </div>
          ) : (
            <div className="space-y-3">
              <svg viewBox="0 0 460 150" className="w-full h-40 overflow-visible">
                <line
                  x1="20"
                  y1="75"
                  x2="440"
                  y2="75"
                  stroke="var(--border-line)"
                  strokeDasharray="4 4"
                />
                {savingsPath.points && (
                  <polyline
                    fill="none"
                    stroke="var(--brand-blue)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={savingsPath.points}
                  />
                )}
                {savingsPath.coords.map(c => (
                  <g key={c.label}>
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r="4.5"
                      fill={c.savings >= 0 ? 'var(--status-success)' : 'var(--status-danger)'}
                      stroke="var(--bg-surface)"
                      strokeWidth="2"
                    />
                    <text
                      x={c.x}
                      y="146"
                      textAnchor="middle"
                      fill="var(--text-ink-muted)"
                      className="text-[9px] font-mono"
                    >
                      {c.label.split(' ')[0]}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </motion.div>
      </div>

      {/* Row 3: Monthly Cash Flow Comparison Bars + Budget Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.1, ease: MOMENTUM_EASE }}
          className="lg:col-span-7 p-6 rounded-2xl bg-surface border border-line space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-blue" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                Monthly Income vs. Expenses ({monthsWindow} Months)
              </h3>
            </div>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {monthlySeries.map(pt => (
              <div key={pt.month} className="space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-ink tabular-nums">{pt.label}</span>
                  <span className="font-mono text-[11px] text-ink-muted tabular-nums">
                    In: <strong className="text-success">{formatCurrency(pt.income, currency)}</strong>{' '}
                    · Out:{' '}
                    <strong className="text-danger">{formatCurrency(pt.expenses, currency)}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <AnimatedProgressBar
                    percentage={(pt.income / maxBar) * 100}
                    trackClassName="h-2 bg-surface-inset rounded-full overflow-hidden"
                    fillClassName="h-full bg-success rounded-full"
                  />
                  <AnimatedProgressBar
                    percentage={(pt.expenses / maxBar) * 100}
                    trackClassName="h-2 bg-surface-inset rounded-full overflow-hidden"
                    fillClassName="h-full bg-danger rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.14, ease: MOMENTUM_EASE }}
          className="lg:col-span-5 p-6 rounded-2xl bg-surface border border-line space-y-4"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-line">
            <ShieldCheck className="w-4 h-4 text-success" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
              Budget Performance ({currentMonth})
            </h3>
          </div>

          {budgetPerformance.length === 0 ? (
            <div className="py-10 text-center text-xs text-ink-muted">
              No active monthly budgets for {currentMonth}.
            </div>
          ) : (
            <div className="space-y-3">
              {budgetPerformance.map(b => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl bg-canvas border border-line space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink">{b.category}</span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        b.status === 'exceeded'
                          ? 'text-danger'
                          : b.status === 'warning'
                          ? 'text-warning'
                          : 'text-success'
                      }`}
                    >
                      {b.rawPercentage.toFixed(0)}% used
                    </span>
                  </div>
                  <AnimatedProgressBar
                    percentage={b.clampedPercentage}
                    trackClassName="w-full h-1.5 bg-surface-inset rounded-full overflow-hidden"
                    fillClassName={`h-full rounded-full ${
                      b.status === 'exceeded'
                        ? 'bg-danger'
                        : b.status === 'warning'
                        ? 'bg-warning'
                        : 'bg-success'
                    }`}
                  />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
