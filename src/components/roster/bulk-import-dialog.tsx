import { useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface BulkImportDialogProps {
  onImport: (playersData: string) => Promise<void>
  trigger?: React.ReactNode
}

export function BulkImportDialog({ onImport, trigger }: BulkImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rosterData, setRosterData] = useState('')
  const [preview, setPreview] = useState<Array<{ number: string; name: string; position?: string }>>([])
  const [error, setError] = useState('')
  
  const exampleFormat = `12 John Smith QB
23 Mike Johnson RB
45 David Williams WR
67 Tom Anderson OL
89 Chris Taylor TE`
  
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text')
    parseAndPreview(text)
  }
  
  const handleTextChange = (text: string) => {
    setRosterData(text)
    parseAndPreview(text)
  }
  
  const parseAndPreview = (text: string) => {
    setError('')
    if (!text.trim()) {
      setPreview([])
      return
    }
    
    const lines = text.trim().split('\n')
    const parsed: typeof preview = []
    const errors: string[] = []
    
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) return
      
      // Match patterns like "12 John Smith QB" or "12 John Smith"
      const match = trimmed.match(/^(\d+)\s+(.+?)(?:\s+(QB|RB|WR|TE|OL|DL|LB|DB|S|K|P|LS))?$/i)
      
      if (match) {
        const [_, number, name, position] = match
        parsed.push({
          number,
          name: name.trim(),
          position: position?.toUpperCase()
        })
      } else {
        errors.push(`Line ${index + 1}: Invalid format`)
      }
    })
    
    if (errors.length > 0) {
      setError(errors.join(', '))
    }
    
    setPreview(parsed)
  }
  
  const handleImport = async () => {
    if (preview.length === 0) {
      setError('No valid players to import')
      return
    }
    
    setLoading(true)
    try {
      await onImport(rosterData)
      setRosterData('')
      setPreview([])
      setOpen(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full h-14 text-lg">
            <Upload className="h-5 w-5 mr-2" />
            Bulk Import Roster
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Players</DialogTitle>
          <DialogDescription>
            Paste your roster from a spreadsheet or document. Add 20 players in under 2 minutes!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Format Help */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Format:</strong> Jersey# Name Position (one per line)
              <pre className="mt-2 text-xs bg-muted p-2 rounded">
{exampleFormat}
              </pre>
            </AlertDescription>
          </Alert>
          
          {/* Input Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Paste Your Roster
            </label>
            <Textarea
              placeholder="Paste roster here or type directly..."
              value={rosterData}
              onChange={(e) => handleTextChange(e.target.value)}
              onPaste={handlePaste}
              className="min-h-[200px] font-mono text-sm"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              Tip: Copy from Excel, Google Sheets, or any text document
            </p>
          </div>
          
          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Preview ({preview.length} players)
                </label>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="max-h-[200px] overflow-y-auto border rounded-lg p-2 space-y-1">
                {preview.map((player, index) => (
                  <div key={index} className="flex items-center gap-2 py-1">
                    <Badge variant="outline" className="w-12 justify-center">
                      #{player.number}
                    </Badge>
                    <span className="flex-1 text-sm">{player.name}</span>
                    {player.position && (
                      <Badge variant="secondary">{player.position}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setRosterData('')
              setPreview([])
              setError('')
              setOpen(false)
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || preview.length === 0}
          >
            {loading ? 'Importing...' : `Import ${preview.length} Players`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}