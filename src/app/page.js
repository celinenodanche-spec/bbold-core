'use client'
import AccessGate from '../components/AccessGate'
import BBoldCore from '../components/BBoldCore'

export default function Page() {
  return (
    <AccessGate>
      <BBoldCore />
    </AccessGate>
  )
}
