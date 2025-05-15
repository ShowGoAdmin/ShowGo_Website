import React from 'react'
import { useEvent } from './EventContext'

const EventCard = () => {

  const { events } = useEvent();
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4'>
          {events.length === 0 ? (
            <p>No Events Available</p>
          ) : (
            events.map((event, index) =>(
              <div key={index} className='border rounded-lg p-4 shadow-lg bg-white'>
                <img src={event.image} alt={event.name} className='w-full h-40 object-cover rounded'/>
                <h2 className='text-lg font-bold mt-20'>{event.name}</h2>
                <p className='text-sm text-gray-600'>{event.description}</p>
                <p className='font-semibold mt-1'>Price: ₹{event.price}</p>
              </div>
            ))
          )}
    </div>
  );
};

export default EventCard