#!/usr/bin/env bash

OS="$(uname -s)"

case "$OS" in
    Linux*)     OS_TYPE=Linux;;
    Darwin*)    OS_TYPE=Mac;;
    *)          OS_TYPE="UNKNOWN:$OS"
esac

echo "Operating System: $OS_TYPE"

echo "Installing Dependencies...."
if [ "$OS_TYPE" = "Mac" ]; then
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "Homebrew not found. Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    else
        echo "Homebrew is already installed."
    fi
    brew install appwrite
else
    curl -sL https://appwrite.io/cli/install.sh | bash
fi


docker run -it --add-host host.docker.internal:host-gateway --rm \
    --volume /var/run/docker.sock:/var/run/docker.sock \
    --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
    --entrypoint="install" \
    appwrite/appwrite:1.7.4

projectId="resonate"


# Remove previous Appwrite Cli data
rm -rf ~/.appwrite | bash

# Ask contributor account credentials   
while true; do
    appwrite login --endpoint "http://localhost:80/v1"
    if [ $? -eq 0 ]; then
        break
    else
        echo "Appwrite Login failed. Please try again."
    fi
done


echo "Starting resonate project set up...."
# Get team id for project creation
read -p "Please provide the team Id as instructed in the Resonate Set Up Guide:" teamId

# Creating the project
appwrite projects create --project-id resonate --name Resonate --team-id "$teamId"


# Creating IOS and Android platforms
appwrite projects create-platform --project-id "$projectId" --type flutter-android --key com.resonate.resonate --name Resonate
appwrite projects create-platform --project-id "$projectId" --type flutter-ios --key com.resonate.resonate --name Resonate

# Creating Server Key and Retrieving it from response
create_key_response=$(appwrite projects create-key --project-id "$projectId" --name "Appwrite Server Key" --scopes 'sessions.write' 'users.read' 'users.write' 'teams.read' 'teams.write' 'databases.read' 'databases.write' 'collections.read' 'collections.write' 'attributes.read' 'attributes.write' 'indexes.read' 'indexes.write' 'documents.read' 'documents.write' 'files.read' 'files.write' 'buckets.read' 'buckets.write' 'functions.read' 'functions.write' 'execution.read' 'execution.write' 'locale.read' 'avatars.read' 'health.read' 'providers.read' 'providers.write' 'messages.read' 'messages.write' 'topics.read' 'topics.write' 'subscribers.read' 'subscribers.write' 'targets.read' 'targets.write' 'rules.read' 'rules.write' 'migrations.read' 'migrations.write' 'vcs.read' 'vcs.write' 'assistant.read' --json)
secret=$(echo "$create_key_response" | awk -F' : ' '/secret/ {print $2}')
echo $create_key_response
echo $secret


# Pushing Server Key as env variable for cloud functions to use
appwrite project create-variable --key APPWRITE_API_KEY --value "$secret"


# Push endpoint as environment variable for functions to use (host.docker.internal used to access localhost from inside of script)
appwrite project create-variable --key APPWRITE_ENDPOINT --value "http://host.docker.internal:80/v1"

# Pushing the project's core defined in appwrite.json
appwrite push collection
appwrite push bucket

# Uploading all the files on the server
appwrite storage create-file --bucket-id "64a13095a4c87fd78bc6" --file-id "67012e19003d00f39e10" --file "amber_profile_image.jpeg"
appwrite storage create-file --bucket-id "64a13095a4c87fd78bc6" --file-id "67012e19003d00f39e11" --file "classic_profile_image.jpeg"
appwrite storage create-file --bucket-id "64a13095a4c87fd78bc6" --file-id "67012e19003d00f39e12" --file "cream_profile_image.jpeg"
appwrite storage create-file --bucket-id "64a13095a4c87fd78bc6" --file-id "67012e19003d00f39e13" --file "forest_profile_image.jpeg"
appwrite storage create-file --bucket-id "64a13095a4c87fd78bc6" --file-id "67012e19003d00f39e14" --file "time_profile_image.jpeg"
appwrite storage create-file --bucket-id "64a13095a4c87fd78bc6" --file-id "67012e19003d00f39e15" --file "vintage_profile_image.jpeg"
appwrite storage create-file --bucket-id "64a13095a4c87fd78bc6" --file-id "67012e19003d00f39e16" --file "story.png"
appwrite storage create-file --bucket-id "64a13095a4c87fd78bc6" --file-id "67012e19003d00f39e17" --file "chapter.png"

echo "---- Appwrite Set Up complete (only functions left) ----"


echo "Setting Up Livekit now ..."
while true; do
    read -p "Do you wish to opt for Livekit Cloud or Host Livekit locally? For Locally: y, For Cloud: n (y/n)" isLocalDeployment
    if [[ $isLocalDeployment == "y" || $isLocalDeployment == "Y" ]]; then

        echo "You chose to host Livekit locally."

        # check if Livekit server already running
        PROCESS_ID=$(pgrep -f "livekit-server")
        if [ ! -z "$PROCESS_ID" ]; then
            kill $PROCESS_ID
            echo "Livekit Server Already Running Terminating and Starting Again..."
        else
            echo "Starting Livekit Server"
        fi

        # Command to Start Livekit Server
        docker run -d --name livekit -p 7880:7880 livekit/livekit-server --dev --bind 0.0.0.0

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
echo "Pushing Livekit credentials as env variables if you need any changes do them in your Appwrite Resonate projects Global Env variables"
appwrite project create-variable --key LIVEKIT_HOST --value "$livekitHostURL"
appwrite project create-variable --key LIVEKIT_SOCKET_URL --value "$livekitSocketURL"
appwrite project create-variable --key LIVEKIT_API_KEY --value "$livekitAPIKey"
appwrite project create-variable --key LIVEKIT_API_SECRET --value "$livekitAPISecret"
appwrite push functions --with-variables

echo "Many Congratulations Resonate Backend set up is complete !!! please further read the onboarding guide for connecting frontend to backend"