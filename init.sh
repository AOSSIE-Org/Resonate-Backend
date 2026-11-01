#!/usr/bin/env bash

OS="$(uname -s)"

case "$OS" in
    Linux*)     OS_TYPE=Linux;;
    Darwin*)    OS_TYPE=Mac;;
    *)          OS_TYPE="UNKNOWN:$OS"
esac

echo "Operating System: $OS_TYPE"

if [ "$OS_TYPE" = "Mac" ]; then
    if ! command -v node &> /dev/null; then
        echo "Node.js not found. Installing via Homebrew..."
        if ! command -v brew &> /dev/null; then
            echo "Homebrew not found. Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install node
    else
        echo "Node.js already installed."
    fi
else
    if ! command -v node &> /dev/null; then
        echo "Node.js not found. Installing via apt..."
        sudo apt update -y
        sudo apt install -y nodejs npm
    else
        echo "Node.js already installed."
    fi
fi



echo "Installing Appwrite CLI via npm"
npm install -g appwrite-cli@28.1.0

if curl -fsS -m 5 http://localhost:80/v1/health/version >/dev/null 2>&1; then
    echo "Appwrite is already running - skipping the installer."
else
    MSYS_NO_PATHCONV=1 docker run -it --add-host host.docker.internal:host-gateway --rm \
        --publish 20080:20080 \
        --volume /var/run/docker.sock:/var/run/docker.sock \
        --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
        --entrypoint="install" \
        appwrite/appwrite:2.3.0
fi

projectId="resonate"


# Remove previous Appwrite Cli data
rm -rf ~/.appwrite | bash

# A fresh instance has no accounts, and the CLI cannot register one - the first
# account has to be created through the console in a browser.
echo ""
echo "--------------------------------------------------------------------"
echo " Open http://localhost in a browser and SIGN UP to create the console"
echo " account for this instance, then come back and log in with it here."
echo "--------------------------------------------------------------------"
read -p "Press enter once you have created the account..." _

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

set_project_variable() {
    appwrite project create-variable --project-id "$projectId" \
        --variable-id "$1" --key "$1" --value "$2" >/dev/null 2>&1 \
        || echo "  (variable $1 already exists, leaving it alone)"
}

organizationId=$(appwrite list-organizations --json | node -pe \
    "JSON.parse(require('fs').readFileSync(0,'utf8')).organizations[0]['\$id']" 2>/dev/null)
if [ -z "$organizationId" ]; then
    read -p "Could not detect an organization. Please paste your organization Id: " organizationId
fi
echo "Using organization $organizationId"

# Creating the project
appwrite organization create-project --organization-id "$organizationId" --project-id "$projectId" --name Resonate


# Creating IOS and Android platforms
appwrite project create-android-platform --project-id "$projectId" --platform-id android-resonate --application-id com.resonate.resonate --name Resonate
appwrite project create-apple-platform --project-id "$projectId" --platform-id apple-resonate --bundle-identifier com.resonate.resonate --name Resonate

set_project_variable APPWRITE_ENDPOINT "http://host.docker.internal:80/v1"

# Pushing the project's core defined in appwrite.json
appwrite push tables --all --force
appwrite push bucket --all --force

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

echo "Setting Up MeiliSearch now ..."
while true; do
    read -p "Do you wish to opt for Meilisearch Cloud or Host Meilisearch locally? For Locally: y, For Cloud: n (y/n)" isLocalDeployment
    if [[ $isLocalDeployment == "y" || $isLocalDeployment == "Y" ]]; then

        echo "You chose to host MeiliSearch locally."
        echo "Starting MeiliSearch Server"
        

        # Command to Start MeiliSearch Server
        docker rm -f meilisearch >/dev/null 2>&1 || true
        docker run -d --name meilisearch \
        -p 7700:7700 \
        -e MEILI_ENV=development \
        -e MEILI_MASTER_KEY=myMasterKey \
        -v ${PWD}/meili_data:/meili_data \
        getmeili/meilisearch:latest

        meilisearchEndpoint="http://host.docker.internal:7700"
        meilisearchMasterKey="myMasterKey"
        break

    elif [[ $isLocalDeployment == "n" || $isLocalDeployment == "N" ]]; then
        echo "You chose to use Meilisearch Cloud."
        echo "Please follow the steps on the Guide to Set Up Meilisearch Cloud, hence getting your self Meilisearch endpoint, master key"
        read -p "Please Provide Meilisearch Host Url: " meilisearchEndpoint
        read -p "Please Provide Meilisearch Master key: " meilisearchMasterKey
        break

    else
        echo "Invalid input. Please enter 'y' for local or 'n' for cloud."
    fi
done

echo "Pushing Meilisearch credentials as env variables if you need any changes do them in your Appwrite Resonate projects Global Env variables"
set_project_variable MEILISEARCH_ENDPOINT "$meilisearchEndpoint"
set_project_variable MEILISEARCH_ADMIN_API_KEY "$meilisearchMasterKey"


echo "Setting Up Livekit now ..."
while true; do
    read -p "Do you wish to opt for Livekit Cloud or Host Livekit locally? For Locally: y, For Cloud: n (y/n)" isLocalDeployment
    if [[ $isLocalDeployment == "y" || $isLocalDeployment == "Y" ]]; then

        echo "You chose to host Livekit locally."

        # Livekit runs as a container, so pgrep on the host never matched it and
        # the docker run below then died on a duplicate container name.
        if [ -n "$(docker ps -aq --filter name=^/livekit$)" ]; then
            echo "Livekit Server Already Running Terminating and Starting Again..."
        else
            echo "Starting Livekit Server"
        fi

        # Command to Start Livekit Server
        docker rm -f livekit >/dev/null 2>&1 || true
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
set_project_variable LIVEKIT_HOST "$livekitHostURL"
set_project_variable LIVEKIT_SOCKET_URL "$livekitSocketURL"
set_project_variable LIVEKIT_API_KEY "$livekitAPIKey"
set_project_variable LIVEKIT_API_SECRET "$livekitAPISecret"
appwrite push functions --force --with-variables

# Seed the achievement thresholds.
echo "Seeding achievement thresholds ..."
appwrite functions create-execution --function-id reconcile-achievements

echo "Many Congratulations Resonate Backend set up is complete !!! please further read the onboarding guide for connecting frontend to backend"