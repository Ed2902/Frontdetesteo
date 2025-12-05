import { useEffect, useContext } from 'react'
import AuthContext from './context/AuthContext'

import {
  ORG_ID,
  ticketsApi,        
  getTicketsHeaders, 
} from './components/Tickets/Usuario/CrearTicket/Service.js'

import { registerWebPush } from './utils/webpushClient'

export default function AppWebPushInit() {
  const { user } = useContext(AuthContext) || {}

  useEffect(() => {
    if (!user) return

    console.log('👤 user desde AuthContext =>', user)

    const principalId = String(
      user.id_usuario ??
        user.usuario_id ??
        user.id ??
        user.user_id ??
        user.principalId ??
        ''
    )

    if (!principalId) {
      console.warn('⚠️ No se pudo determinar principalId para WebPush')
      return
    }

    // 🔐 Usamos el mismo helper que en todo el módulo de tickets
    const headers = getTicketsHeaders(user)

    console.log('🎫 Headers detectados para WebPush =>', headers)

    registerWebPush({
      axiosInstance: ticketsApi,
      headers,
      orgId: ORG_ID,
      principalId,
    })
  }, [user])

  return null
}
