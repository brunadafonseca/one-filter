import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [filteredClasses, setFilteredClasses] = useState([])
  const [classes, setClasses] = useState([])
  const [dates, setDates] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const today = new Date();
    let datesObj = []
    datesObj.push({ day: today.getDate(), month: today.getMonth() + 1, date: today.toDateString()})

    for (let i = 1; i <= 13; i++) {
      const weirdDate = today.setDate(today.getDate() + 1);
      const nextDay = new Date(weirdDate);

      datesObj.push({ day: nextDay.getDate(), month: nextDay.getMonth() + 1, date: nextDay.toDateString() });
    }

    setDates([...datesObj])
  }, [])

  useEffect(() => {
    setFilteredClasses([...classes])
  }, [classes])

  useEffect(() => {
    if (dates.length && !classes.length) {
      fetchClassesToday()
    }
  }, [dates])

  const fetchClassesPerDay = async (date) => {
    const { day, month } = date

    const data = await fetch(`https://api.one.fit/v1/en/nl/Classes/AMS?date=${day}%2F${month}%2F2019`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(res => res.json())
      .then(data => data.data)

    return data
  }

  const fetchClassesToday = async () => {
    setLoading(true)
    const classesToday = await fetchClassesPerDay(dates[0])

    setLoading(false)
    setClasses([{ date: dates[0].date, data: classesToday }])
  }

  const fetchNextTwoWeeks = async () => {
    setLoading(true)
    const allClasses = await Promise.all(dates.map(async date => {
      const c = await fetchClassesPerDay(date)
      const obj = { date: date.date, data: c }

      return obj
    }))

    setLoading(false)
    setClasses(allClasses)
  }

  const search = e => {
    setFilteredClasses(classes.map(obj => {
      if (obj.data) {
        const data = obj.data.filter(item => {
          const query = e.target.value.toLowerCase().trim()
          const name = item.name.toLowerCase()
          return name.includes(query)
        })

        return { ...obj, data }
      }

      return obj
    }))
  }

  const setClass = slotsFree => {
    if (slotsFree === 0) {
      return 'sold-out'
    } else if (slotsFree > 0 && slotsFree < 3) {
      return 'almost-sold-out'
    } else {
      return 'available'
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>OneFilter</h1>
        <div className="actions">
          <button className="primary" onClick={fetchClassesPerDay}>Search today</button>
          <button className="search-all" onClick={fetchNextTwoWeeks}>Search next 2 weeks</button>
        </div>

        <input
          type="search"
          className="filter"
          placeholder="Filter by name"
          onKeyDown={(e) => {
            if (e.keyCode === 13) { search(e) }
          }}
        />
      </div>

      <div className="content">
        {(!classes.length && !loading) && <div className="helper-text">Click one of the buttons to start your search</div>}
        {loading && <div className="helper-text">Fetching data...</div>}
        {!loading && filteredClasses.map((data) => (
          <ul id="list">
            <span className="span date">{data.date}</span>
            {(!data.data) && <div style={{ textAlign: 'center', width: '100%', marginBottom: '2rem' }}>There are no classes on this day</div> }

            {data.data && (
              data.data.map(item => {
                const { slots_free, name, time_start, location } = item

                return (
                  <li className={setClass(slots_free)}>
                    <div className="wrapper">
                      <h3 className="name">{name}</h3>
                      <div className="separator"></div>
                      <span className="time">{time_start}</span>
                      <div className="separator"></div>
                      <span className="slots-free">{slots_free} free spots</span>
                    </div>
                    <div className="wrapper">
                      <span className="location-name">{location.name}</span>
                      <div className="separator"></div>
                      <span className="location-address">{location.address}</span>
                    </div>
                  </li>
                )
              })
            )}
          </ul>
        ))}
      </div>
    </div>
  );
}

export default App;
