'use client'

import { useState } from 'react'
import { 
  Wallet, 
  Copy, 
  Check, 
  RefreshCw, 
  Link, 
  Unlink,
  Shield,
  Database,
  Globe,
  Clock,
  ExternalLink,
  QrCode
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface BlockchainSettingsProps {
  isConnected: boolean
  walletAddress?: string | null
  onCopyAddress: () => void
  copied: boolean
}

export function BlockchainSettings({ 
  isConnected, 
  walletAddress, 
  onCopyAddress, 
  copied 
}: BlockchainSettingsProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum')
  const { toast } = useToast()

  const networks = [
    { id: 'ethereum', name: 'Ethereum', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'polygon', name: 'Polygon', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'arbitrum', name: 'Arbitrum', icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'optimism', name: 'Optimism', icon: Globe, color: 'text-red-500', bg: 'bg-red-50' }
  ]

  const handleConnect = () => {
    setIsConnecting(true)
    setTimeout(() => {
      setIsConnecting(false)
      toast({
        title: 'Wallet conectada',
        description: 'Tu wallet ha sido conectada exitosamente',
      })
    }, 1500)
  }

  const handleDisconnect = () => {
    toast({
      title: 'Wallet desconectada',
      description: 'Tu wallet ha sido desconectada',
    })
  }

  const transactions = [
    {
      hash: '0x8f3...9e2a',
      type: 'Registro médico',
      date: '15 Mar 2026',
      status: 'confirmado',
      network: 'Ethereum'
    },
    {
      hash: '0x7a2...4b1c',
      type: 'Permiso de acceso',
      date: '10 Mar 2026',
      status: 'confirmado',
      network: 'Polygon'
    },
    {
      hash: '0x9c4...8d3f',
      type: 'Verificación de identidad',
      date: '05 Mar 2026',
      status: 'confirmado',
      network: 'Ethereum'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-azul-electrico" />
            <CardTitle>Wallet Conectada</CardTitle>
          </div>
          <CardDescription>Gestiona tu wallet para interacciones en blockchain</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected && walletAddress ? (
            <>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-electric/5 border border-azul-electrico/20">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-electric p-3">
                    <Wallet className="size-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-azul-profundo">Wallet conectada</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs font-mono text-gris-grafito">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </code>
                      <Button variant="ghost" size="icon" className="size-6" onClick={onCopyAddress}>
                        {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 border-0">Conectado</Badge>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleDisconnect} className="flex-1 btn-outline-premium">
                  <Unlink className="size-4 mr-2" />
                  Desconectar
                </Button>
                <Button variant="outline" className="flex-1 btn-outline-premium">
                  <ExternalLink className="size-4 mr-2" />
                  Ver en explorer
                </Button>
                <Button variant="outline" className="btn-outline-premium">
                  <QrCode className="size-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="rounded-full bg-gray-100 p-4 w-fit mx-auto mb-4">
                <Wallet className="size-8 text-gris-grafito" />
              </div>
              <p className="text-sm text-gris-grafito">No hay wallet conectada</p>
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="btn-premium mt-4"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="size-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Link className="size-4 mr-2" />
                    Conectar Wallet
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Red Blockchain */}
      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="size-5 text-azul-electrico" />
            <CardTitle>Red Blockchain</CardTitle>
          </div>
          <CardDescription>Selecciona la red para tus transacciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {networks.map((network) => {
              const NetworkIcon = network.icon
              return (
                <div
                  key={network.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedNetwork === network.id
                      ? 'border-azul-electrico bg-azul-electrico/5'
                      : 'border-gray-200 hover:border-azul-electrico/30'
                  }`}
                  onClick={() => setSelectedNetwork(network.id)}
                >
                  <div className={`rounded-lg p-2 ${network.bg}`}>
                    <NetworkIcon className={`size-4 ${network.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-azul-profundo">{network.name}</p>
                    <p className="text-xs text-gris-grafito">Mainnet</p>
                  </div>
                  {selectedNetwork === network.id && (
                    <Check className="size-4 text-azul-electrico" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Transacciones recientes */}
      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-azul-electrico" />
            <CardTitle>Transacciones recientes</CardTitle>
          </div>
          <CardDescription>Historial de transacciones en blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((tx, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Database className="size-4 text-azul-electrico" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-azul-profundo">{tx.type}</p>
                    <p className="text-xs text-gris-grafito mt-0.5">{tx.date} • {tx.network}</p>
                  </div>
                </div>
                <div className="text-right">
                  <code className="text-xs font-mono text-gris-grafito">{tx.hash}</code>
                  <Badge className="ml-2 bg-emerald-50 text-emerald-600 border-0 text-xs">
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}