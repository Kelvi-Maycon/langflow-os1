import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Bar, BarChart, ResponsiveContainer, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useStore } from '@/store/main'

const chartConfig = {
  value: {
    label: 'Palavras Adicionadas',
    color: 'hsl(var(--primary))',
  },
}

export function WeeklyChart() {
  const { words } = useStore()

  const data = useMemo(() => {
    const arr = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      d.setHours(0, 0, 0, 0)

      const nextD = new Date(d)
      nextD.setDate(d.getDate() + 1)

      const count = words.filter(
        (w) => w.createdAt >= d.getTime() && w.createdAt < nextD.getTime(),
      ).length

      return {
        day: d.toLocaleDateString('pt-BR', { weekday: 'short' }).charAt(0).toUpperCase(),
        value: count,
        isCurrent: i === 6,
      }
    })

    // Prevent empty chart from collapsing structure
    const maxVal = Math.max(...arr.map((d) => d.value))
    if (maxVal === 0) {
      arr[6].value = 1
    }

    return arr
  }, [words])

  return (
    <Card className="p-6 bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300 rounded-[24px]">
      <div className="flex items-center justify-between mb-8">
        <h4 className="font-bold text-foreground">Novas Palavras</h4>
        <span className="text-[10px] font-bold bg-secondary px-2 py-1 rounded-md text-muted-foreground border border-border">
          ÚLTIMOS 7 DIAS
        </span>
      </div>

      <div className="h-[120px] w-full">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={32}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isCurrent ? '#F472B6' : 'hsl(var(--muted))'}
                    className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="flex justify-between mt-4 px-2">
        {data.map((item, i) => (
          <span
            key={i}
            className={`text-xs font-bold ${item.isCurrent ? 'text-primary' : 'text-muted-foreground/60'}`}
          >
            {item.day.trim()}
          </span>
        ))}
      </div>
    </Card>
  )
}
