import { useStore } from '@/store/main'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Trash2, HardDrive } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Settings() {
  const { settings, updateSettings, words, removeWord } = useStore()
  const { toast } = useToast()

  const handleSaveLevel = (val: string) => {
    updateSettings({ level: val as any })
    toast({ title: 'Configurações salvas', description: 'Nível de inglês atualizado.' })
  }

  const handleClearData = () => {
    if (confirm('Tem certeza? Isso apagará todo o seu progresso.')) {
      localStorage.removeItem('langflow_words')
      localStorage.removeItem('langflow_settings')
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-2">Personalize sua experiência de aprendizado.</p>
      </header>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Preferências de Aprendizado</CardTitle>
          <CardDescription>Defina seu nível atual para adequar as explicações.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nível de Inglês (CEFR)</Label>
            <Select value={settings.level} onValueChange={handleSaveLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione seu nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A1">A1 - Iniciante</SelectItem>
                <SelectItem value="A2">A2 - Básico</SelectItem>
                <SelectItem value="B1">B1 - Intermediário</SelectItem>
                <SelectItem value="B2">B2 - Pós-Intermediário</SelectItem>
                <SelectItem value="C1">C1 - Avançado</SelectItem>
                <SelectItem value="C2">C2 - Fluente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Meta Diária (Novas Palavras)</Label>
            <Input
              type="number"
              value={settings.dailyGoal}
              onChange={(e) => updateSettings({ dailyGoal: parseInt(e.target.value) || 10 })}
              onBlur={() => toast({ title: 'Meta salva', description: 'Meta diária atualizada.' })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Dados e Armazenamento
          </CardTitle>
          <CardDescription>
            Gerencie seus dados armazenados localmente no navegador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm bg-secondary p-4 rounded-md">
            <p>
              <strong>Palavras salvas:</strong> {words.length}
            </p>
            <p>
              <strong>Dados sincronizados:</strong> LocalStorage apenas (seguro e privado)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Gerenciar Lista</Label>
            <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
              {words.length === 0 && (
                <p className="p-4 text-center text-muted-foreground text-sm">
                  Nenhuma palavra salva ainda.
                </p>
              )}
              {words.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-2 text-sm hover:bg-muted/50"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{w.word}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {w.translation}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWord(w.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button variant="destructive" className="w-full" onClick={handleClearData}>
            Apagar Todos os Dados
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
