//livekit-server-sdk imports
import { AccessToken } from 'livekit-server-sdk';

const generateToken = (req,res)=> {
// if this room doesn't exist, it'll be automatically created when the first
// client joins
const roomName = req.body.nameOfRoom;
// identifier to be used for participant.
// it's available as LocalParticipant.identity with livekit-client SDK
const participantName = req.body.nameOfParticipant;

//if participant name or roomName not provided :
if(participantName == undefined || roomName == undefined){
    res.json({"msg":"Participant Name or Room Name is invalid, unable to create Access Token"});
}

//creating the new access token for the participant.
try{
    const at = new AccessToken(`${process.env.LIVEKIT_API_KEY}`, `${process.env.LIVEKIT_API_SECRET}`, {
        identity: participantName,
      });
      
      //adding permissions to the access token before converting to jwt
      at.addGrant({
          roomJoin: true,
          room: roomName,
          canPublish: false,
          canSubscribe: true,
        });
      //converting to JWT
      const token = at.toJwt();
      console.log('access token', token);
      res.json(JSON.stringify(token));//access token is sent as response
}catch(error){
    console.log(error);
}
}

export {generateToken}