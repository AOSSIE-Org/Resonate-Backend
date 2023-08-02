# Resonate - An Open Source Social Voice Platform

### This project is divided into two repositories:
1. [Resonate Flutter App](https://github.com/AOSSIE-Org/Resonate)
2. Resonate Backend (You are here)

Go to [this repository](https://github.com/AOSSIE-Org/Resonate) to know more about the project.

## Environment Setup :

1. Pre-requisites :

    (a) Clone the Repo : `git clone https://github.com/AOSSIE-Org/Resonate-Backend`

    (b) Run this command to install required dependencies from package.json : `npm install`

2. Create a `.env` file in the project's root directory

3. Follow [this guide](https://docs.livekit.io/cloud/project-management/keys-and-tokens/) to obtain your `HOST`, `API-KEY`, `API-SECRET` from [livekit-cloud](https://livekit.io/cloud).

4. Create a new project on [Appwrite Cloud](https://appwrite.io/) or self host it locally by pulling their [docker image](https://appwrite.io/docs/self-hosting). Know more about Appwrite [here](https://appwrite.io/docs).

5. The `.env` file should consist of :

    (a)`LIVEKIT_API_KEY`

    (b)`LIVEKIT_API_SECRET`

    (c)`LIVEKIT_HOST`

    (d)`LIVEKIT_SOCKET_URL`

    (e)`APPWRITE_ENDPOINT`

    (f)`APPWRITE_PROJECT_ID`

    (g)`APPWRITE_SECRET_API_KEY`

## API Documentation

#### All Post Routes 



 `POST` `/room/create-room` `(create room in livekit )`

##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | None      |  required | `{name:"gamingRoom",description:"this is a gaming room",adminEmail:"gaming@gmail.cm",tags:"gaming"}`   | N/A  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | none          | `application/json`                |  `{msg:Room created successfully ...}`                              |
> | `500`         | `application/json`                | `{"code":"500","message":"Error"}`                                  |


##### Example cURL

> ```javascript
>  curl -X POST -H "Content-Type: application/json" --data @post.json http://localhost:3000/
> ```





 `POST` `/room/join-room` `(join room with livekit )`
##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | None      |  required | `{roomName:"gamingroom",userEmail:"user@gmail.com"}`   | N/A                                                                   |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | none          | `application/json`                |  `{msg:Success ...}`                              |
> | `500`         | `application/json`                | `{"code":"500","message":"Error"}`                                  |


##### Example cURL

> ```javascript
>  curl -X POST -H "Content-Type: application/json" --data @post.json http://localhost:3000/
> ```



#### All Get Routes


 `GET` `/` `(Sending Hello World )`

##### Parameters

> `None`

##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `text/plain;charset=UTF-8`        | YAML string                                                         |

##### Example cURL

> ```javascript
>  curl -X GET -H "Content-Type: application/json" http://localhost:3000/
> ```



#### All Deleting Routes

`DELETE` `/room/delete-room` `(delete room from livekit )`

##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | None      |  required | `{appwriteRoomDocId:"hsae2e41ca",token:"jskandse23234njb3TWZA"}` | N/A                                                                   |

##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | `{msg:"Success"}`                                                   |
> | `400`         | `application/json`                | `{msg:"Invalid Token or Server Error"}`                                                   |

##### Example cURL

> ```javascript
>  curl -X DELETE -H "Content-Type: application/json" http://localhost:3000/
> ```





------------------------------------------------------------------------------------------

## Communication Channels

If you have any questions, need clarifications, or want to discuss ideas, feel free to reach out through the following channels:

-   [Discord Server](https://discord.com/invite/6mFZ2S846n)
-   [Email](mailto:aossie.oss@gmail.com)

We appreciate your contributions and look forward to working with you to make this project even better!
