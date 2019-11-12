import threading, time, firebase_admin, json, sys, datetime
import firebase_admin
from firebase_admin import credentials, firestore
from sense_hat import SenseHat

sense = SenseHat()

cred = credentials.Certificate("serviceAccount.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# doc = db.collection(u'home').document(u'sensors').get()
# print(doc.to_dict())

class updater(threading.Thread):
    def run(self):
        doc = db.collection(u'home').document(u'sensors').get()
        sensor_data = doc.to_dict()
        temperature_array = sensor_data['temperature']
        last_humidity = sensor_data['humidity']
        if(len(temperature_array) == 0):
            temperature_array.append({
                u'value': round(sense.get_temperature()),
                u'timestamp': datetime.datetime.now()
            })
        while not kill.wait(1):
            new_temperature = round(sense.get_temperature())
            new_humidity = round(sense.get_humidity())
            if(new_temperature != temperature_array[0]['value'] or new_humidity != last_humidity):
                print('Updating temperature and humidity to: {}C - {}%'.format(new_temperature, new_humidity))
                temperature_object = {
                    u'value': new_temperature,
                    u'timestamp': datetime.datetime.now()
                }
                temperature_array.insert(0, temperature_object)
                
                if(len(temperature_array) > 7):
                    temperature_array.pop()
                db.collection(u'home').document(u'sensors').update({
                    u'temperature': temperature_array,
                    u'humidity': new_humidity
                })
                last_humidity = new_humidity
            else:
                print('No need to update temperature or humidity')
            time.sleep(60)
        print('stopping updater')

def get_color(name, isOn):
    if name == 'frontDoor' or name == 'backDoor':
        if isOn:
            return (81, 226, 81)
        else:
            return (145, 0, 0)
    elif name == 'power':
        if isOn:
            return (95, 164, 255)
        else:
            return (17, 65, 119)
    else:
        if isOn:
            return (255, 230, 0)
        else:
            return (190, 178, 3)

def update_matrix(document):
    pixel_color = get_color(document['name'], document['isOn'])
    for pos in document['positions']:
        sense.set_pixel(pos['x'], pos['y'], pixel_color)

def on_snapshot(col_snapshot, changes, read_time):
    print(u'Received updates from controls')
    for doc in col_snapshot:
        if doc.id != 'alarm':
            print(u'Updating {}'.format(doc.id))
            update_matrix(doc.to_dict())
        else:
            print(u'Checking if alarm is turned on')

class listener(threading.Thread):
    def run(self):
        db.collection(u'home').where(u'type', u'==', u'control').on_snapshot(on_snapshot)


try:
    kill = threading.Event()
    fs_updater = updater()
    fs_updater.daemon = True
    fs_updater.start()

    fs_listener = listener()
    fs_listener.daemon = True
    fs_listener.start()

    while True:
        time.sleep(100)
except KeyboardInterrupt:
    print('Interrupted: Stopping threads...')
    kill.set()
    sense.clear()
    fs_updater.join()
    fs_listener.join()
    print('Threads joined, exiting...')
    sys.exit(0)