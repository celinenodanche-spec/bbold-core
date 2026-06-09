export const metadata = {
  title: 'B.BOLD Core — Multi-Agent Platform',
  description: 'Plateforme multiagent B.BOLD Agency',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, background: '#0a0008' }}>
        {children}
      </body>
    </html>
  )
}
