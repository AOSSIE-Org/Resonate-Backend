# Upcoming Room Time Checking function
A Cron Function to check all the exsistent upcoming room scheduled timings and comparing to current time in order to activate a upcoming room if the current time is less than 5 minutes away from the scheduled time

## 🧰 Usage
It is a Cron function repeating itself after every 5 minutes

### How does it work 
Fetches all the list of upcoming rooms, for each upcoming room compares the time difference from current time to scheduled, if the difference is less than or equal to 5 minutes updates the isTime attrubute of that upcoming room document in the upcoming room collection to "True" and sends a push notification to all the subscribers of that upcoming room via FCM