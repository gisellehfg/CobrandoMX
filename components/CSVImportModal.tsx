'use client'
import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
  onImported: () => void
}

export default function CSVImportModal({ onClose, onImported }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card border border-border rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg">Importar CSV</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Próximamente disponible. Por ahora agrega clientes uno por uno.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold"
        >
          Entendido
        </button>
      </div>
    </div>
  )
}