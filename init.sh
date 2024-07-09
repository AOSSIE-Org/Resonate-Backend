#!/usr/bin/env sh

OS="$(uname -s)"

case "$OS" in
    Linux*)     OS_TYPE=Linux;;
    Darwin*)    OS_TYPE=Mac;;
    *)          OS_TYPE="UNKNOWN:$OS"
esac


echo "Operating System: $OS_TYPE"

echo "Installing Dependencies...."

if [ "$OS_TYPE" = "Mac" ]; then
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    brew install appwrite
    brew install livekit
    brew install livekit-cli
else
    curl -sL https://appwrite.io/cli/install.sh | bash
    curl -sSL https://get.livekit.io | bash
    curl -sSL https://get.livekit.io/cli | bash
fi


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

# start ngrok tunnel
echo "Starting Ngrok tunnel to get the url to provide as redirect for Oauth "

while true; do
  read -p "Please provide the ngrok auth token in order to start the tunnel: " ngrokOauthToken
  
  if [ -z "$ngrokOauthToken" ]; then
    echo "Auth token cannot be empty. Please try again."
    continue
  fi

  # Stop any existing ngrok container
  docker stop ngrok &> /dev/null && docker rm ngrok &> /dev/null
  
  # Run the ngrok container
  docker run -d --name ngrok -p 4040:4040 -e NGROK_AUTHTOKEN=$ngrokOauthToken ngrok/ngrok:latest http host.docker.internal:5050
  
  sleep 2

  if docker ps | grep -q ngrok; then
    echo "Ngrok tunnel started successfully."
    sleep 1
    ngrok_url=$(curl -s http://localhost:4040/api/tunnels | awk -F '"public_url":"https://' '{print $2}' | cut -d '"' -f 1)
    echo "ngrok tunnel Domain Name: $ngrok_url"
    
    break
  else
    echo "Failed to start ngrok tunnel. Please try again."
  fi
done


echo "Starting resonate project set up...."
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
        reverse_proxy http://host.docker.internal:7880 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Default site
    reverse_proxy /* http://host.docker.internal:80 {
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

docker stop caddy &> /dev/null && docker rm caddy &> /dev/null
docker run -d --name caddy -p 5050:5050 -v $PWD/Caddyfile:/etc/caddy/Caddyfile -v caddy_data:/data caddy
echo "Your ngrok tunnel domain: $ngrok_url"
echo "For ngrok logs visit http://localhost:4040"