import { useMemo } from 'react'
import { useStore } from '@/store/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Tooltip as RechartsTooltip,
  Cell as PieCell,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { format, subDays } from 'date-fns'

const barConfig = {
  value: {
    label: 'Words Practiced',
    color: 'hsl(var(--primary))',
  },
}

export default function Statistics() {
  const { stats } = useStore()

  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i)
      const dateKey = format(d, 'yyyy-MM-dd')
      const count = stats.practiceHistory?.[dateKey] || 0

      // Assure at least one visual bar to avoid empty collapsed charts visually
      const val = count === 0 && i === 6 ? 1 : count

      return {
        day: format(d, 'EEE'),
        value: count,
        displayValue: val,
        isCurrent: i === 6,
      }
    })
  }, [stats.practiceHistory])

  const pieData = [
    { name: 'Correct', value: stats.flashcardCorrect, color: '#22c55e' },
    {
      name: 'Incorrect',
      value: Math.max(0, stats.flashcardAttempts - stats.flashcardCorrect),
      color: '#ef4444',
    },
  ]

  const hasPieData = stats.flashcardAttempts > 0

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
          Performance Statistics
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Track your learning journey and performance breakdown.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
            <CardTitle className="text-xl font-bold text-slate-900">Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent className="p-8 flex-1">
            <div className="h-[300px] w-full mt-4">
              <ChartContainer config={barConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={48}>
                      {weeklyData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isCurrent ? 'hsl(var(--primary))' : '#e2e8f0'}
                          className="transition-all duration-300 hover:opacity-80"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="flex justify-between mt-6 px-4">
              {weeklyData.map((item, i) => (
                <span
                  key={i}
                  className={`text-sm font-bold tracking-wide uppercase ${item.isCurrent ? 'text-primary' : 'text-slate-400'}`}
                >
                  {item.day}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
            <CardTitle className="text-xl font-bold text-slate-900">
              Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-8 flex-1">
            {hasPieData ? (
              <>
                <div className="h-[280px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: '16px',
                          border: '1px solid #f1f5f9',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                        }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={6}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={8}
                      >
                        {pieData.map((entry, index) => (
                          <PieCell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-extrabold text-slate-900">
                      {stats.flashcardAttempts}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Total Reviews
                    </span>
                  </div>
                </div>
                <div className="flex gap-8 mt-8">
                  {pieData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"
                    >
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-bold text-slate-700">
                        {item.name} ({item.value})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-slate-500 py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PieChart className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-bold text-lg text-slate-700">Not enough data yet</p>
                <p className="text-sm mt-1">Complete some flashcards to see your breakdown.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
