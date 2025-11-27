import './SeccionDinamicatickets.css'
import TicketsList from '../Usuario/TicketsList'
import MisTareas from '../Usuario/MisTareas'
import TicketsSoporte from '../Usuario/CrearTicket/TicketsSoporte.jsx'

const SeccionDinamicaTickets = ({ selectedSection }) => {
  let contenido
  switch (selectedSection) {
    case 'usuarios':
      contenido = <TicketsList />
      break

    case 'soporte':
      contenido = <TicketsSoporte />
      break

      case 'mistareas':
      contenido = <MisTareas />
      break
   
      default:
      contenido = <TicketsList />
  }

  return <div className='tickets-seccion'>{contenido}</div>
}

export default SeccionDinamicaTickets
