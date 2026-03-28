# Track Activity Function

## 📌 Description
This function is used to track backend activity events such as:

- Room creation
- User joining
- Room deletion

## 📥 Request Body

```json
{
  "eventType": "ROOM_CREATED",
  "userId": "user123",
  "metadata": {
    "roomId": "abc123"
  }
}