import React, { createContext, useContext, useState } from 'react'

const EventContext = createContext();

export const EventProvider = ({children}) => {
     const [events, setEvents] = useState([]);

     //Function To add a new event
     const addEvent = (newEvent) => {
          setEvents((prevEvents) => [...prevEvents, newEvent])
     };

     return (
          <EventContext.Provider value={{ events, addEvent }}>
               {children}
          </EventContext.Provider>
     );
};
export const useEvent = () =>{
     return useContext(EventContext);
}