import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Sidebar from '../../components/Sidebar/Sidebar';
import MenuTickets from '../../components/Tickets/Menutickets/Menutickets';
import SeccionDinamicaTickets from '../../components/Tickets/Secciontickets/SeccionDinamicatickets';
import './Tickets.css';

export default function Tickets() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState('usuarios'); 
  const [initialTicketId, setInitialTicketId] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ticketId = params.get('ticketId');

    if (ticketId) {
      setInitialTicketId(ticketId);
      setSelectedSection('mistareas');
      params.delete('ticketId');
      navigate(
        {
          pathname: location.pathname,
          search: params.toString(),
        },
        { replace: true }
      );
    }
  }, [location.search, location.pathname, navigate]);
  useEffect(() => {
    if (selectedSection !== 'mistareas' && initialTicketId) {
      setInitialTicketId(null);
    }
  }, [selectedSection, initialTicketId]);

  const handleSelectSection = (section) => {
    setSelectedSection(section);
  };

  return (
    <section className="layout">
      <Sidebar />

      <div className="body">
        <MenuTickets
          selectedSection={selectedSection}
          onSelectSection={handleSelectSection}
        />

        <SeccionDinamicaTickets
          selectedSection={selectedSection}
          initialTicketId={initialTicketId}
        />
      </div>
    </section>
  );
}
