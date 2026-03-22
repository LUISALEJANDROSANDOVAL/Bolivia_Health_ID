'use client'

import { 
  CreditCard, 
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
  QrCode,
  AlertCircle,
  Lock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWallet } from '@/contexts/wallet-context'
import { useAccount, useChainId, useDisconnect } from 'wagmi'

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
  const { connect, disconnect: contextDisconnect } = useWallet()
  const { chain } = useAccount()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    connect()
  }

  const handleDisconnect = () => {
    disconnect()
    contextDisconnect()
  }

  const isFuji = chainId === 43113 || chain?.id === 43113

  return (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-azul-electrico" />
            <CardTitle>Billetera & Red</CardTitle>
          </div>
          <CardDescription>Control total de tu identidad descentralizada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected && walletAddress ? (
            <>
              <div className="flex flex-col gap-4 p-5 rounded-3xl bg-foreground/[0.03] border border-border shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-gradient-electric p-3 shadow-lg shadow-cyan-500/20">
                      <CreditCard className="size-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground/40 uppercase tracking-widest">Cuenta Activa</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="text-sm font-black text-foreground tracking-tight">
                          {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                        </code>
                        <Button variant="ghost" size="icon" className="size-8 hover:bg-cyan-500/10 text-cyan-500" onClick={onCopyAddress}>
                          {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-0 font-black uppercase tracking-widest text-[10px] px-3 py-1">
                    Conectado
                  </Badge>
                </div>

                <div className="h-px bg-border/50" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-cyan-500/10 p-2 border border-cyan-500/20">
                      <Globe className="size-4 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground/40 uppercase tracking-widest">Red Actual</p>
                      <p className="text-sm font-black text-foreground">{chain?.name || 'Avalanche Fuji'}</p>
                    </div>
                  </div>
                  {!isFuji && (
                    <Badge variant="destructive" className="font-black uppercase tracking-widest text-[10px] flex items-center gap-1">
                      <AlertCircle className="size-3" /> Red Incorrecta
                    </Badge>
                  )}
                  {isFuji && (
                    <Badge className="bg-cyan-500/10 text-cyan-500 border-0 font-black uppercase tracking-widest text-[10px]">Fuji Testnet</Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleDisconnect} className="flex-1 btn-outline-premium py-6 rounded-2xl group">
                  <Unlink className="size-4 mr-2 group-hover:text-red-500 transition-colors" />
                  Desconectar
                </Button>
                <Button variant="outline" className="flex-1 btn-outline-premium py-6 rounded-2xl" onClick={() => window.open(`https://testnet.snowtrace.io/address/${walletAddress}`, '_blank')}>
                  <ExternalLink className="size-4 mr-2" />
                  Ver en Explorer
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-10 rounded-3xl border-2 border-dashed border-border/50 bg-foreground/[0.02]">
              <div className="rounded-full bg-foreground/5 p-5 w-fit mx-auto mb-4 border border-border shadow-inner">
                <Shield className="size-10 text-foreground/20" />
              </div>
              <h4 className="text-lg font-black text-foreground tracking-tight">Billetera no detectada</h4>
              <p className="text-sm text-foreground/50 font-bold max-w-[280px] mx-auto mt-1">
                Conecta tu billetera para acceder a tus registros médicos encriptados.
              </p>
              <Button 
                onClick={handleConnect} 
                className="btn-premium mt-6 h-12 px-8 rounded-2xl shadow-xl shadow-cyan-500/20"
              >
                <Link className="size-4 mr-2" />
                Conectar Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seguridad & Nodos */}
      <Card className="card-premium overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] to-transparent pointer-events-none" />
        <CardHeader>
          <div className="flex items-center gap-2 relative z-10">
            <Shield className="size-5 text-cyan-500" />
            <CardTitle>Seguridad de Nodo</CardTitle>
          </div>
          <CardDescription>Estado de la red y disponibilidad de datos</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Estado IPFS</p>
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-black text-foreground">Online</span>
                  </div>
               </div>
               <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
                  <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">Cifrado</p>
                  <div className="flex items-center gap-2">
                    <Lock className="size-3 text-cyan-500" />
                    <span className="text-sm font-black text-foreground">AES-256</span>
                  </div>
               </div>
            </div>
            
            <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-border flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <RefreshCw className="size-4 text-foreground/30 animate-spin-slow" />
                  <span className="text-xs font-bold text-foreground/50">Sincronización automática activa</span>
               </div>
               <Badge className="bg-foreground/5 text-foreground/40 border-0 font-black uppercase tracking-widest text-[9px]">v1.4.0</Badge>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}