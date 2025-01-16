import { Button } from "@/components/ui/button"
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-custom flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Page Not Found</h2>
        <p className="text-muted-foreground">The conversation you're looking for could not be found.</p>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    </div>
  )
}

