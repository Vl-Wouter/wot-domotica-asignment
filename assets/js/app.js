const db = firebase.firestore()
const homeRef = db.collection('home')

/**
 * * Initialize data listeners for separate documents
 * @param {String} name 
 */
const watchControlData = (name) => {
    homeRef.doc(name).onSnapshot(doc => {
        const {isOn} = doc.data()
        console.log(`Logged ${name}. Is on: ${isOn}`)
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
    const controls = ['lights', 'power', 'frontDoor', 'backDoor']
    controls.forEach(control => {
        watchControlData(control)
        initEventListener(control)
    })
}

const watchSensors = () => {
    homeRef.doc('sensors').onSnapshot(doc => {
        const { humidity, temperature } = doc.data()
        const humidityElement = document.querySelector(`#humidityValue`)
        const temperatureElement = document.querySelector(`#temperatureValue`)
        humidityElement.innerHTML = humidity
        temperatureElement.innerHTML = temperature[0]
    })
}

/**
 * Initialize app
 */
const initApp = () => {
    // initialize controls
    initControls()
    // initialize sensors
    watchSensors()
}

initApp()