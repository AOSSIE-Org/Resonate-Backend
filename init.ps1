Write-Host "Installing Dependencies...."


# Set the execution policy to RemoteSigned for the current user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Function to check if Scoop is installed
function Is-ScoopInstalled {
    $scoopPath = "$env:USERPROFILE\scoop\shims\scoop.ps1"
    return Test-Path $scoopPath
}

# Check if Scoop is installed
if (Is-ScoopInstalled) {
    Write-Host "Scoop is already installed."
} else {
    Write-Host "Scoop is not installed. Installing Scoop..."
    Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
}

# Verify installation
if (Is-ScoopInstalled) {
    Write-Host "Scoop has been successfully installed."
} else {
    Write-Host "Failed to install Scoop."
}


Write-Host "Install Appwrite-cli using Scoop"
scoop install https://raw.githubusercontent.com/appwrite/sdk-for-cli/master/scoop/appwrite.json

docker run -it --add-host host.docker.internal:host-gateway --rm `
    --volume /var/run/docker.sock:/var/run/docker.sock `
    --volume "$(pwd)/appwrite:/usr/src/code/appwrite:rw" `
    --entrypoint="install" `
    appwrite/appwrite:1.6.0

$projectId = "resonate"

# Remove previous Appwrite Cli data
Remove-Item -Recurse -Force $HOME\.appwrite

# Ask contributor account credentials   
while ($true) {
    appwrite login --endpoint "http://localhost:80/v1"
    if ($LASTEXITCODE -eq 0) {
        break
    } else {
        Write-Host "Login failed. Please try again."
    }
}

Write-Host "Starting resonate project set up...."
# Get team id for project creation
$teamId = Read-Host "Please provide the team Id as instructed in the Resonate Set Up Guide"

# Creating the project
appwrite projects create --project-id resonate --name Resonate --teamId $teamId

# Creating IOS and Android platforms
appwrite projects create-platform --project-id $projectId --type flutter-android --key com.resonate.resonate --name Resonate
appwrite projects create-platform --project-id $projectId --type flutter-ios --key com.resonate.resonate --name Resonate

# Creating Server Key and Retrieving it from response
$create_key_response = appwrite projects create-key --project-id $projectId --name "Appwrite Server Key" --scopes 'sessions.write' 'users.read' 'users.write' 'teams.read' 'teams.write' 'databases.read' 'databases.write' 'collections.read' 'collections.write' 'attributes.read' 'attributes.write' 'indexes.read' 'indexes.write' 'documents.read' 'documents.write' 'files.read' 'files.write' 'buckets.read' 'buckets.write' 'functions.read' 'functions.write' 'execution.read' 'execution.write' 'locale.read' 'avatars.read' 'health.read' 'providers.read' 'providers.write' 'messages.read' 'messages.write' 'topics.read' 'topics.write' 'subscribers.read' 'subscribers.write' 'targets.read' 'targets.write' 'rules.read' 'rules.write' 'migrations.read' 'migrations.write' 'vcs.read' 'vcs.write' 'assistant.read'
$secret = ($create_key_response -split ' : ')[1].Trim()
Write-Host $create_key_response
Write-Host $secret

# Pushing Server Key as env variable for cloud functions to use
appwrite project create-variable --key APPWRITE_API_KEY --value $secret

# Push endpoint as environment variable for functions to use (host.docker.internal used to access localhost from inside of script)
appwrite project create-variable --key APPWRITE_ENDPOINT --value "http://host.docker.internal:80/v1"

# Pushing the project's core defined in appwrite.json
appwrite deploy collection
appwrite deploy bucket
appwrite storage create-file --bucket-id "64a13095a4c87fd78bc6" --file-id "67012e19003d00f39e12" --file "pink_profile_image.jpeg"
Write-Host "---- Appwrite Set Up complete (only functions left)----"


Write-Host "Setting Up Livekit now ..."
# Push Livekit credentials as env variables for functions to use
while ($true) {
    $isLocalDeployment = Read-Host "Do you wish to opt for Livekit Cloud or Host Livekit locally? For Locally: y, For Cloud: n (y/n)"
    if ($isLocalDeployment -eq "y" -or $isLocalDeployment -eq "Y") {
        Write-Host "You chose to host Livekit locally."

        # check if Livekit server already running
        $PROCESS_ID = Get-Process | Where-Object { $_.Path -match "livekit-server" } | Select-Object -ExpandProperty Id
        if ($PROCESS_ID) {
            Stop-Process -Id $PROCESS_ID
            Write-Host "Livekit Server Already Running Terminating and Starting Again..."
        } else {
            Write-Host "Starting Livekit Server"
        }

        # Command to Start Livekit Server
        docker run -d --name livekit -p 7880:7880 livekit/livekit-server --dev --bind 0.0.0.0

        $livekitHostURL = "http://host.docker.internal:7880"
        $livekitSocketURL = "wss://host.docker.internal:7880"
        $livekitAPIKey = "devkey"
        $livekitAPISecret = "secret"
        break

    } elseif ($isLocalDeployment -eq "n" -or $isLocalDeployment -eq "N") {
        Write-Host "You chose to use Livekit Cloud."
        Write-Host "Please follow the steps on the Guide to Set Up Livekit Cloud, hence getting your self Livekit host url, socket url, API key, API secret"
        $livekitHostURL = Read-Host "Please Provide Livekit Host Url"
        $livekitSocketURL = Read-Host "Please Provide Livekit Socket Url"
        $livekitAPIKey = Read-Host "Please Provide Livekit API key"
        $livekitAPISecret = Read-Host "Please Provide Livekit API secret"
        break

    } else {
        Write-Host "Invalid input. Please enter 'y' for local or 'n' for cloud."
    }
}

# Push Livekit credentials as env variables for functions to use
Write-Host "Pushing Livekit credentials as env variables if you need any changes do them in your Appwrite Resonate project's Global Env variables"
appwrite project create-variable --key LIVEKIT_HOST --value $livekitHostURL
appwrite project create-variable --key LIVEKIT_SOCKET_URL --value $livekitSocketURL
appwrite project create-variable --key LIVEKIT_API_KEY --value $livekitAPIKey
appwrite project create-variable --key LIVEKIT_API_SECRET --value $livekitAPISecret
appwrite deploy function --with-variables
