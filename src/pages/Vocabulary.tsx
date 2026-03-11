import { useState } from 'react'
import { useStore } from '@/store/main'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function Vocabulary() {
  const { words } = useStore()
  const [search, setSearch] = useState('')

  const filteredWords = words
    .filter(
      (w) =>
        w.word.toLowerCase().includes(search.toLowerCase()) ||
        w.translation.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
          Vocabulary Hub
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Manage and review all your captured words and phrases.
        </p>
      </header>

      <Card className="p-6 border-slate-100 shadow-sm rounded-3xl">
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search words or translations..."
            className="pl-12 bg-slate-50/50 border-slate-200 focus-visible:ring-primary h-12 rounded-xl text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-slate-900 py-5">Word/Phrase</TableHead>
                <TableHead className="font-bold text-slate-900 py-5">Translation</TableHead>
                <TableHead className="font-bold text-slate-900 py-5">Status</TableHead>
                <TableHead className="font-bold text-slate-900 py-5 text-right">
                  Date Added
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWords.length > 0 ? (
                filteredWords.map((word) => (
                  <TableRow key={word.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-slate-900 text-base py-4">
                      {word.word}
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium py-4">
                      {word.translation}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant="secondary"
                        className={
                          word.status === 'mastered'
                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                            : word.status === 'srs'
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                        }
                      >
                        {word.status.charAt(0).toUpperCase() + word.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-slate-500 font-medium py-4">
                      {format(new Date(word.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-slate-300" />
                      <p className="font-medium">No vocabulary found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
