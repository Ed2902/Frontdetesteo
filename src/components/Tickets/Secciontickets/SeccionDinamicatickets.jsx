import './SeccionDinamicatickets.css';
import TicketsList from '../Usuario/TicketsList';
import MisTareas from '../Usuario/MisTareas/MisTareas.jsx';
import TicketsSoporte from '../Usuario/CrearTicket/TicketsSoporte.jsx';

const SeccionDinamicaTickets = ({ selectedSection, initialTicketId }) => {
  let contenido;

  switch (selectedSection) {
    case 'usuarios':
      contenido = <TicketsList />;
      break;

    case 'soporte':
      contenido = <TicketsSoporte />;
      break;

    case 'mistareas':
      contenido = <MisTareas initialTicketId={initialTicketId} />;
      break;

    default:
      contenido = <TicketsList />;
  }

  return <div className="tickets-seccion">{contenido}</div>;
};

export default SeccionDinamicaTickets;
