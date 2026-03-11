import { useStore } from '@/store/main'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Flame, ArrowRight, BookOpen } from 'lucide-react'
import { format } from 'date-fns'

export default function Index() {
  const { words, stats } = useStore()

  const successRate =
    stats.flashcardAttempts > 0
      ? Math.round((stats.flashcardCorrect / stats.flashcardAttempts) * 100)
      : 0

  const recentWords = [...words].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
          Welcome Back!
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Ready to master some new vocabulary today?</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Words Learned</p>
              <h2 className="text-2xl font-bold text-slate-900">{words.length}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Success Rate</p>
              <h2 className="text-2xl font-bold text-slate-900">{successRate}%</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Study Streak</p>
              <h2 className="text-2xl font-bold text-slate-900">{stats.streak || 0} Days</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/30 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/40 transition-colors duration-700" />
        <div className="relative z-10 flex-1">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Continue your journey</h2>
          <p className="text-slate-300 max-w-lg leading-relaxed">
            You have words waiting to be reviewed in your spaced repetition queue. Stay consistent
            to build your fluency.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="bg-white text-slate-900 hover:bg-slate-100 rounded-full font-bold px-8 h-14 relative z-10 whitespace-nowrap shadow-lg hover:scale-[1.02] transition-transform active:scale-95"
        >
          <Link to="/flashcards">
            Start Learning Now <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </Button>
      </div>

      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h3>
        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {recentWords.map((word) => (
              <div
                key={word.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-3"
              >
                <div>
                  <p className="font-bold text-slate-900 text-lg">{word.word}</p>
                  <p className="text-sm text-slate-500">{word.translation}</p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <span
                    className={cn(
                      'text-xs font-bold px-3 py-1 rounded-md capitalize tracking-wide',
                      word.status === 'mastered'
                        ? 'bg-green-100 text-green-700'
                        : word.status === 'srs'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700',
                    )}
                  >
                    {word.status}
                  </span>
                  <span className="text-sm font-medium text-slate-400 min-w-[100px] text-right">
                    {format(new Date(word.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            ))}
            {recentWords.length === 0 && (
              <div className="p-10 text-center text-slate-500 font-medium">
                No words added yet. Start by capturing some vocabulary!
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
