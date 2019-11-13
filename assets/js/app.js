const db = firebase.firestore()
const homeRef = db.collection('home')
const overlay = document.querySelector('.overlay')
const loginBtn = document.querySelector('#loginBtn')
let temperatureChart

/**
 * * Initialize data listeners for separate documents
 * @param {String} name 
 */
const watchControlData = (name) => {
    homeRef.doc(name).onSnapshot(doc => {
        const {isOn} = doc.data()
        updateControlState(name, isOn)
    })
}

const updateControlLabel = (name, isOn) => {
    const elementLabel = document.querySelector(`#${name}State`)
    let isDoor = false
    name === 'frontDoor' || name === 'backDoor' ? isDoor = true : '' 
    if(isOn) {
        isDoor ? elementLabel.innerHTML = 'OPEN' : elementLabel.innerHTML = 'ON'
    } else {
        isDoor ? elementLabel.innerHTML = 'CLOSED' : elementLabel.innerHTML = 'OFF'
    }
}

/**
 * * update the visual state of a control on data change
 * @param {String} name Name of the control
 * @param {boolean} isOn Value of the isOn state
 */
const updateControlState = (name, isOn) => {
    const elementButton = document.querySelector(`#${name}Switch`)
    if(isOn === true) {
        elementButton.classList.add('-on')
        updateControlLabel(name, isOn)
    } else {
        elementButton.classList.remove('-on')
        updateControlLabel(name, isOn)
    }
}

/**
 * * Push a new isOn state to a control listener in DB
 * @param {String} name Name of control
 */
const pushState = (name) => {
    // Get the current state
    const elementButton = document.querySelector(`#${name}Switch`)
    let currentState = false
    if(elementButton.classList.contains('-on')) { currentState = true }
    homeRef.doc(name).update({
        isOn: !currentState
    })
    .catch(error => {
        console.error(error)
    })
}

/**
 * * Initialize event listeners for controls
 * @param {String} name Name of the control
 */
const initEventListener = (name) => {
    const elementButton = document.querySelector(`#${name}Switch`)
    elementButton.addEventListener('click', (e) => {
        e.preventDefault()
        pushState(name)
    })
}

/**
 * * Initialize all controls with data watching and event listeners
 * @param {String} name name of the control
 */
const initControls = () => {
    const controls = ['lights', 'power', 'frontDoor', 'backDoor', 'alarm']
    controls.forEach(control => {
        watchControlData(control)
        initEventListener(control)
    })
}

/**
 * Watch data and send latest to updatechart()
 * @param {Object} chart 
 */
const watchSensors = (chart) => {
    homeRef.doc('sensors').onSnapshot(doc => {
        const { humidity, temperature } = doc.data()
        const humidityElement = document.querySelector(`#humidityValue`)
        const temperatureElement = document.querySelector(`#temperatureValue`)
        const outerRing = document.querySelector('#tempOuterRing')
        const tempValue = temperature[0].value
        humidityElement.innerHTML = humidity
        if(tempValue > 40) {
            outerRing.style.backgroundColor = 'rgb(236, 117, 61)'
        } else if(tempValue > 30) {
            outerRing.style.backgroundColor = 'rgb(61, 236, 90)'
        } else {
            outerRing.style.backgroundColor = 'rgb(61, 122, 236)'
        }
        temperatureElement.innerHTML = tempValue
        updateChart(chart, temperature[0])

    })
}
const alarmsound = new Audio('./assets/sound/swamp.mp3')

const loopLights = () => {
    homeRef.doc('lights').get()
    .then(lights => {
        const { isOn } = lights.data()
        homeRef.doc('lights').set({
            isOn: !isOn
        })
    })
}

const activateAlarm = () => {
    alarmsound.play()
    alarmsound.loop = true
    homeRef.doc("frontDoor").set({
        isOn: true
    })
    homeRef.doc("backDoor").set({
        isOn: true
    })
    loopLights()
}

const resetAlarm = () => {
    alarmsound.pause()
    alarmsound.currentTime = 0
    homeRef.doc("frontDoor").set({
        isOn: false
    })
    homeRef.doc("backDoor").set({
        isOn: false
    })
}

const checkAlarm = () => {
    homeRef.doc("alarm").onSnapshot(doc => {
        const { isOn } = doc.data()
        console.log(isOn)
        isOn ? activateAlarm() : resetAlarm()
    })
}

const updateChart = (chart, temperature) => {
    dateLabel = new Date(temperature.timestamp.seconds * 1000)
    chart.data.labels.push(dateLabel)
    chart.data.labels.shift()
    chart.data.datasets.forEach(dataset => {
        dataset.data.push({
            x: dateLabel,
            y: temperature.value,
        })
        dataset.data.shift()
    })
    chart.update()
}

/**
 * Creates a new graph based on given data with Chart.js
 * @param {Array} labels Array with labels for the graph
 * @param {Array} data Array with graph data
 */
const createChart = (labels, data) => {
    const ctx = document.getElementById('tempChart')
    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets:[{
                label: 'Temperature',
                borderColor: 'rgba(169, 182, 211, 1)',
                backgroundColor: 'rgb(183, 198, 216)',
                data: data,
                pointBackgroundColor: 'rgba(223, 229, 236)',
                pointBorderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                scaleLabel: {
                    display: false,
                },
                xAxes: [{
                    type: 'time',
                    distribution: 'series',
                    time: {
                        unit: 'minute'
                    },
                    gridLines: {
                        display: false,
                        drawBorder: false,
                        drawTicks: false,
                    },
                    ticks: {
                        display: false,
                        lineHeight: 0,
                        fontFamily: "'Nunito', sans-serif"
                    }
                }],
                yAxes: [{
                    gridLines: {
                        drawBorder: false,
                        drawTicks: false,
                        display: false,
                    },
                    ticks: {
                        display: false,
                        beginAtZero: true,
                    }
                }]
            },
            legend: {
                display: false,
            }
        }
    })
    return myChart
}

/**
 * Prepares the chart data
 */
const initChart = () => {
    return new Promise((resolve, reject) => {
        homeRef.doc('sensors').get()
        .then(doc => doc.data())
        .then(data => {
            const temps = data.temperature
            const chartData = []
            const labelPoints = []
            temps.forEach(temp => {
                chartDate = new Date(temp.timestamp.seconds * 1000)
                chartData.unshift({
                    x: chartDate,
                    y: temp.value,
                })
                labelPoints.unshift(chartDate)
            })
            temperatureChart = createChart(labelPoints, chartData)
            resolve(temperatureChart)
        })
        .catch(error => {
            reject(error)
        })
    })
}

firebase.auth().onAuthStateChanged(user => {
  if(user) {
    if(!overlay.classList.contains('-hidden')) {
      overlay.classList.add('-hidden')
    }
    initApp()
  } else {
    overlay.classList.remove('-hidden')
  }
})

loginBtn.addEventListener('click', (e) => {
  e.preventDefault()
  const email = document.querySelector('#email').value
  const pass = document.querySelector('#password').value

  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
  .then(() => {
    firebase.auth().signInWithEmailAndPassword(email, pass)
  })
  .catch(err => console.error(err))
})

/**
 * Initialize app
 */
const initApp = () => {
    // initialize controls
    initControls()
    // Initialize chart
    initChart().then(chart => {
        // initialize sensors
        watchSensors(chart)

    })
    .catch(error => {
        console.error(error)
    })
    checkAlarm()
}