# wot-domotica-asignment

Simulating a SmartHome-application using a simple web portal, Google Firebase and the Raspberry Pi Sense Hat. Google Firebase is used for user authentication and storing data in Google Firestore. You can test the web application side on the Github Pages website linked to this repository: coming soon

To set up the Pi app, see [Setup](#setup)

## Contributors

Wouter Vlaeyen - [GitHub](https://github.com/Vl-Wouter) - [Website](https://www.wouterv.be)

Design of the application is inspired by a Dribbble post by [Michal Parulski](https://www.dribbble.com/Shuma87): [Link](https://www.dribbble.com/shots/6914699-Smart-Home-App)

## Assignment

![Image](https://i.imgur.com/yWILHFX.png)

3 types of lights to be shown on the Sense Hat LED Matrix:

* Lights:
  * Should be yellow when on
  * Should be darker yellow when turned off
* Power plugs:
  * Should be bright blue when turned on
  * Should be darker blue when turned off
* Doors
  * Should be green when open
  * Should be red when closed

The web portal should also show an alarm button that opens all doors, makes the lights flash and plays an alarm sound. Besides that the temperature and humidity should also be read from the Pi.

## Setup

Clone the repository

```bash
git clone https://github.com/Vl-Wouter/wot-domotica-asignment.git
```

Place your `serviceAccount.json` file in `/pi`. Without this the pi application will not run. By doing this you might also want to change the firebase details in `/assets/js/firebase-details.js` to fit your project.

...
