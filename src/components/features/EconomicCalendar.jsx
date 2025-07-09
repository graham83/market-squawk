import React, { useState, useEffect } from 'react';
import { Card, Typography } from '@material-tailwind/react';
import NextEventTypewriter from './NextEventTypewriter';
import mockEvents from '../../data/mock-events.json';

const EconomicCalendar = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Load mock events
    setEvents(mockEvents);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Typography variant="h2" className="text-white font-bold">
          Economic Calendar
        </Typography>
        <div className="flex items-center space-x-4">
          {/* Theme toggle placeholder */}
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Next Event Terminal Display */}
      <NextEventTypewriter events={events} />

      {/* Week Selector */}
      <div className="mb-6">
        <Typography variant="h6" className="text-gray-300 mb-2">
          Select Week
        </Typography>
        <select className="bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="jul7-13">Jul 7 - Jul 13</option>
          <option value="jul14-20">Jul 14 - Jul 20</option>
          <option value="jul21-27">Jul 21 - Jul 27</option>
          <option value="jul28-aug3">Jul 28 - Aug 3</option>
        </select>
      </div>

      {/* Events Table */}
      <Card className="bg-gray-800 border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-4 text-gray-300">DATE & TIME</th>
                <th className="p-4 text-gray-300">EVENT</th>
                <th className="p-4 text-gray-300">COUNTRY</th>
                <th className="p-4 text-gray-300">IMPORTANCE</th>
                <th className="p-4 text-gray-300">CATEGORY</th>
                <th className="p-4 text-gray-300">SOURCE</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr key={event._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-4">
                    <div className="text-white font-mono text-sm">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-gray-400 font-mono text-xs">
                      {new Date(event.date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZoneName: 'short'
                      })}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-white">{event.event}</div>
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {event.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-white">{event.country}</span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        event.importance === 'high'
                          ? 'bg-red-500 text-white'
                          : event.importance === 'medium'
                          ? 'bg-yellow-500 text-black'
                          : 'bg-green-500 text-white'
                      }`}
                    >
                      {event.importance.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-sm capitalize ${
                        event.category === 'employment'
                          ? 'text-blue-400'
                          : event.category === 'inflation'
                          ? 'text-red-400'
                          : event.category === 'monetary_policy'
                          ? 'text-purple-400'
                          : event.category === 'gdp'
                          ? 'text-green-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {event.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <a
                      href={event.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      {event.source.name}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-gray-400 text-sm">
          Showing 1 to 5 of 5 results
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1 bg-purple-600 text-white rounded">
            1
          </button>
          <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600">
            2
          </button>
          <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600">
            »
          </button>
        </div>
      </div>
    </div>
  );
};

export default EconomicCalendar;