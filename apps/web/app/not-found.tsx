import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">404 — Page introuvable</h2>
      <Link href="/" className="text-primary underline underline-offset-4 text-sm">
        Retour à l'accueil
      </Link>
    </div>
  )
}
