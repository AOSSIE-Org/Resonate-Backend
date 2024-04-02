# Discussion Time Checkong function
A Cron Fuction to check all the exsistent Discussion scheduled timings and comparing to current time in order to activate a discussion if the current time is less than 5 minutes away from the scheduled time

## 🧰 Usage
It is a Cron function repeating itself after every 5 minutes

### How does it work 
Fetches all the list of discussions, for each discussion compares the time difference from current time to scheduled, if the difference is less than or equal to 5 minutes updates the isTime attrubute of that discussion document in the discussion collection to "True" and sends a push notification to all the subscribers of that discussion via FCM