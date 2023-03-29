const express = require('express')
const app = express()
const port = 3000
const router = express.Router();
const admin = require('firebase-admin');

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Resonate Backend listening on port ${port}`)
})

//Retrieving Information about all rooms
app.get('/api/rooms', async(req, res) => {
    try {
        const roomsData = await admin.firestore().collection('rooms').get();
        const rooms = roomsData.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        for (let i = 0; i < rooms.length; i++) {
            const room = rooms[i];

            const usersData = await admin.firestore().collection(`rooms/${room.id}/users`).get();
            const users = usersData.docs.map(doc => doc.data());


            let numListeners = 0;
            let numModerators = 0;

            users.forEach(user => {
                if (user.role === 'listener') {
                    numListeners++;
                } else if (user.role === 'moderator') {
                    numModerators++;
                }
            });

            room.numListeners = numListeners;
            room.numModerators = numModerators;
        }

        res.status(200).json(rooms);
    } catch (error) {
        console.error(error);
        res.status(500).send('error');
    }
});

//Retrieving Information about a single room
app.get('/api/rooms/:id', async(req, res) => {
    try {
        const roomId = req.params.id;
        const roomData = await admin.firestore().collection('rooms').doc(roomId).get();

        if (!roomData.exists) {
            return res.status(404).send('Room not found');
        }

        const room = roomData.data();
        room.id = roomData.id;

        const speakersData = await admin.firestore().collection(`rooms/${roomId}/users`).where('role', '==', 'speaker').get();
        const speakers = speakersData.docs.map(doc => doc.data());

        // Add the speakers to the room object
        room.speakers = speakers;

        // Return the room data
        res.status(200).json(room);
    } catch (error) {
        console.error(error);
        res.status(500).send('error');
    }
});

//Get user data based on ID
router.get('/:id', async (req, res) => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(req.params.id).get();
    
    // Check if user document exists
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error' });
  }
});

module.exports = router;
