import { Loader2 } from 'lucide-react'

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="mt-4 text-lg font-medium">Loading...</p>
      <p className="text-sm text-muted-foreground">This may take a few moments</p>
    </div>
  )
}

