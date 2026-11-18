import '../styles/studio.css'
import { T, C } from '@/config/tenant'

export const metadata = {
  title: `${T.title}`,
  description: `${T.description}`,
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, background: `${C.bg}` }}>
        {children}
      </body>
    </html>
  )
}
