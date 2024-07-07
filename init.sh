#!/usr/bin/env sh

docker run -it --add-host host.docker.internal:host-gateway --rm \
    --volume /var/run/docker.sock:/var/run/docker.sock \
    --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
    --entrypoint="install" \
    appwrite/appwrite:1.5.7


projectId="resonate"


# Remove previous Appwrite Cli data
rm -rf ~/.appwrite | bash 

# Ask contributor account credentials   
while true; do
    appwrite login
    if [ $? -eq 0 ]; then
        break
    else
        echo "Login failed. Please try again."
    fi
done

# Get team id for project creation
read -p "Please provide the team Id as instructed in the Resonate Set Up Guide:" teamId

# Creating the project
appwrite projects create --projectId resonate --name Resonate --teamId "$teamId"


# Creating IOS and Andriod platforms
appwrite projects createPlatform --projectId "$projectId" --type flutter-android --key com.resonate.resonate --name Resonate
appwrite projects createPlatform --projectId "$projectId" --type flutter-ios --key com.resonate.resonate --name Resonate

# Creating Server Key and Retreiving it from response
create_key_response=$(appwrite projects createKey --projectId "$projectId" --name "Appwrite Server Key" --scopes 'sessions.write' 'users.read' 'users.write' 'teams.read' 'teams.write' 'databases.read' 'databases.write' 'collections.read' 'collections.write' 'attributes.read' 'attributes.write' 'indexes.read' 'indexes.write' 'documents.read' 'documents.write' 'files.read' 'files.write' 'buckets.read' 'buckets.write' 'functions.read' 'functions.write' 'execution.read' 'execution.write' 'locale.read' 'avatars.read' 'health.read' 'providers.read' 'providers.write' 'messages.read' 'messages.write' 'topics.read' 'topics.write' 'subscribers.read' 'subscribers.write' 'targets.read' 'targets.write' 'rules.read' 'rules.write' 'migrations.read' 'migrations.write' 'vcs.read' 'vcs.write' 'assistant.read')
secret=$(echo "$create_key_response" | awk -F' : ' '/secret/ {print $2}')
echo $create_key_response
echo $secret


# Pushing Server Key as env variable for cloud functions to use
appwrite project createVariable --key APPWRITE_API_KEY --value "$secret"


# Push endpoint as environment variable for functions to use (host.docker.internal used to access localhost from inside of script)
appwrite project createVariable --key APPWRITE_ENDPOINT --value "http://host.docker.internal:80/v1"



# Ask contributor for Oauth2 provider config (Google. Github)
echo "Please follow the Set Up Guide on Resonate to create the Oauth2 credentials for Google and Github"



# start ngrok tunnel
echo "Starting Ngrok tunnel to get the url to provide as redirect for Oauth "
ngrok http 5050 > /dev/null &
ngrok_pid=$!

if [ $? -eq 0 ]; then
    echo "ngrok tunnel started successfully."
else
    echo "Error: ngrok tunnel start up failed."
    exit 1
fi

sleep 1

ngrok_url=$(curl -s http://localhost:4040/api/tunnels | awk -F '"public_url":"https://' '{print $2}' | cut -d '"' -f 1)

echo "ngrok tunnel Domain Name: $ngrok_url"


read -p "Enter the Google App ID: " googleAppId
read -p "Enter the Google App Secret: " googleSecret
appwrite projects updateOAuth2 --projectId "$projectId" --provider 'google' --appId "$googleAppId" --secret "$googleSecret" --enabled true

read -p "Enter the GitHub App ID: " githubAppId
read -p "Enter the GitHub App Secret: " githubSecret
appwrite projects updateOAuth2 --projectId "$projectId" --provider 'github' --appId "$githubAppId" --secret "$githubSecret" --enabled true

# Pushing the project's core defined in appwrite.json
appwrite deploy collection
appwrite deploy function
appwrite deploy bucket

echo "---- Appwrite Set Up complete ----"
echo "Setting Up Livekit now ..."
# Push Livekit credentials as env variables for functions to use
while true; do
    read -p "Do you wish to opt for Livekit Cloud or Host Livekit locally? For Locally: y, For Cloud: n (y/n)" isLocalDeployment
    if [[ $isLocalDeployment == "y" || $isLocalDeployment == "Y" ]]; then
        echo "You chose to host Livekit locally."
        brew install livekit
        brew install livekit-cli

        # check if Livekit server already running
        PROCESS_ID=$(pgrep -f "livekit-server")
        if [ ! -z "$PROCESS_ID" ]; then
            kill $PROCESS_ID
            echo "Livekit Server Already Runing Terminating and Starting Again..."
        else
            echo "Starting Livekit Server"
        fi

        # Command to Start Livekit Server
        livekit-server --dev --bind 0.0.0.0 > livekit.log 2>&1 &

        livekitHostURL="http://host.docker.internal:7880"
        livekitSocketURL="wss://host.docker.internal:7880"
        livekitAPIKey="devkey"
        livekitAPISecret="secret"
        break

    elif [[ $isLocalDeployment == "n" || $isLocalDeployment == "N" ]]; then
        echo "You chose to use Livekit Cloud."
        echo "Please follow the steps on the Guide to Set Up Livekit Cloud, hence getting your self Livekit host url, socket url, API key, API secret"
        read -p "Please Provide Livekit Host Url: " livekitHostURL
        read -p "Please Provide Livekit Socket Url: " livekitSocketURL
        read -p "Please Provide Livekit API key: " livekitAPIKey
        read -p "Please Provide Livekit API secret: " livekitAPISecret
        break

    else
        echo "Invalid input. Please enter 'y' for local or 'n' for cloud."
    fi
done


# Push Livekit credentials as env variables for functions to use
echo "Pushing Livekit credentials as env variables if you need any changes do them in your Appwrtie Resoante projects Global Env variables"
appwrite project createVariable --key LIVEKIT_HOST --value "$livekitHostURL"
appwrite project createVariable --key LIVEKIT_SOCKET_URL --value "$livekitSocketURL"
appwrite project createVariable --key LIVEKIT_API_KEY --value "$livekitAPIKey"
appwrite project createVariable --key LIVEKIT_API_SECRET --value "$livekitAPISecret"

echo "Starting Caddy Web-Server to serve as a proxy to redirect trafic from one tunnel to two services i.e appwrite livekit"

echo "Creating Caddy file"
cat <<EOF > Caddyfile
:5050 {
    # Handle LiveKit requests
    route /livekit/* {
        uri strip_prefix /livekit
        reverse_proxy http://localhost:7880 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Default site
    reverse_proxy /* http://localhost:80 {
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
    }

    log {
        output file caddy_access.log
    }
}
EOF

echo "Caddyfile created successfully."
caddy run > caddy.log 2>&1 &
echo "Your ngrok tunnel domain: $ngrok_url"
echo "For ngrok logs visit http://localhost:4040"