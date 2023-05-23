const functions = require('firebase-functions');
const {google} = require('googleapis');
const {WebhookClient} = require('dialogflow-fulfillment');

// Enter your calendar ID below and service account JSON below


// Set up Google Calendar Service account credentials
const serviceAccountAuth = new google.auth.JWT({
email: serviceAccount.client_email,
key: serviceAccount.private_key,
scopes: 'https://www.googleapis.com/auth/calendar'
});

const calendar = google.calendar('v3');
process.env.DEBUG = 'dialogflow:*'; // enables lib debugging statements

const timeZone = 'Asia/Singapore';
const timeZoneOffset = '+08:00';

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
const agent = new WebhookClient({ request, response });
console.log("Parameters", agent.parameters);
function createReservation (agent) {
   const guests = agent.parameters.guests;
   const time = new Date(Date.parse(agent.parameters.date.split('T')[0] + 'T' + agent.parameters.time.split('T')[1].split('+')[0] + timeZoneOffset));
   const dateTimeEnd = new Date(new Date(time).setHours(time.getHours() + 2));
   const date = new Date(agent.parameters.date);
   const bookingDate = new Date(date);
   const phonenumber = agent.parameters.phonenumber;
   const name = agent.parameters.name;
   const email = agent.parameters.email;
   var phone = phonenumber.toString().length;
   bookingDate.setHours(time.getHours()); 
   bookingDate.setMinutes(time.getMinutes());
   const now = new Date();
   const appointmentTimeString = time.toLocaleString(
       'en-US',
       { month: 'long', day: 'numeric', hour: 'numeric', timeZone: timeZone }
     );
   
       
   if (guests < 1){
       agent.add(`You need to reserve a table for at least one person. Please try remaking the reservation!`);
   } 
   else if (guests > 10){
       agent.add(`You can't make a reservation for more than 100 guests. Please try remaking the reservation!`);
   }else if (time < now){
       agent.add(`You can't make a reservation in the past. Please try remaking the reservation.`);
   } 
   
   else if (bookingDate.getFullYear() > now.getFullYear()) {
       agent.add(`You can't make a reservation for ${bookingDate.getFullYear()} yet. Please choose a date in ${now.getFullYear()}.`);
   }
   else if (phone != 8) {
       agent.add(`Your phone number has to be atleast 8 digits. Please try remaking the reservation!`);
   } else {
   

   // Check the availibility of the time, and make an appointment if there is time on the calendar
   return createCalendarEvent(time, dateTimeEnd, bookingDate, guests, name, phonenumber, email).then(() => {
       agent.add(`You have successfully booked a table for ${guests} guests for ${appointmentTimeString}.`);
   agent.add(`See you at the restaurant ${name}!`);
   agent.add(`Have a wonderful day!`);
   }).catch(() => {
   agent.add(`I'm sorry ,there are no available seats for ${appointmentTimeString}.`);
   });
} 
   }
let intentMap = new Map();
intentMap.set('make_a_reservation', createReservation);
//intentMap.set('restaurant.booking.contact', getContact);
agent.handleRequest(intentMap);
});


function createCalendarEvent (time, dateTimeEnd, bookingDate, guests, name, phonenumber, email) {

return new Promise((resolve, reject) => {
   calendar.events.list({
   auth: serviceAccountAuth, // List events for time period
   calendarId: calendarId,
   timeMin: time.toISOString(),
   timeMax: dateTimeEnd.toISOString()
   }, (err, calendarResponse) => {
   // Check if there is a event already on the Calendar (use this event to make sure reservations can fit up to 100 guests)
   if (err || calendarResponse.data.items.length > 0) {
       reject(err || new Error('Requested time conflicts with another reservation'));
   } else {
       // Create event for the requested time period
       calendar.events.insert({ auth: serviceAccountAuth,
       calendarId: calendarId,
       resource: {summary: 'Reservation:'+ bookingDate  + ', Guests: ' + guests , description: bookingDate +' Name: ' + name + ', PhoneNumber: ' + phonenumber + ', Email: ' + email ,
           start: {dateTime: time},
           end: {dateTime: dateTimeEnd},
           attendees: { email: email}}
                               }
                               

                               
           
       );
   
   }
   
});
});
   
   

       
}