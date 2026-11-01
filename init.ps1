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
}
else {
    Write-Host "Scoop is not installed. Installing Scoop..."
    Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
}

# Verify installation
if (Is-ScoopInstalled) {
    Write-Host "Scoop has been successfully installed."
}
else {
    Write-Host "Failed to install Scoop."
}

# Check if Node.js is installed
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "Node.js is already installed."
}
else {
    Write-Host "Node.js not found. Please install Node.js first."
    scoop install nodejs
}

# Install Appwrite CLI via npm 
Write-Host "Installing Appwrite CLI via npm ..."
npm install -g appwrite-cli@28.1.0


docker run -it --add-host host.docker.internal:host-gateway --rm `
    --publish 20080:20080 `
    --volume /var/run/docker.sock:/var/run/docker.sock `
    --volume "$(pwd)/appwrite:/usr/src/code/appwrite:rw" `
    --entrypoint="install" `
    appwrite/appwrite:2.3.0

$projectId = "resonate"

# Remove previous Appwrite Cli data
Remove-Item -Recurse -Force $HOME\.appwrite

# A fresh instance has no accounts, and the CLI cannot register one - the first
# account has to be created through the console in a browser.
Write-Host ""
Write-Host "--------------------------------------------------------------------"
Write-Host " Open http://localhost in a browser and SIGN UP to create the console"
Write-Host " account for this instance, then come back and log in with it here."
Write-Host "--------------------------------------------------------------------"
Read-Host "Press enter once you have created the account"

# Ask contributor account credentials   
while ($true) {
    appwrite login --endpoint "http://localhost:80/v1"
    if ($LASTEXITCODE -eq 0) {
        break
    }
    else {
        Write-Host "Login failed. Please try again."
    }
}

Write-Host "Starting resonate project set up...."

# Sets a project environment variable.
function Set-ProjectVariable($Name, $Value) {
    appwrite project create-variable --project-id $projectId --variable-id $Name --key $Name --value $Value | Out-Null
    if (-not $?) { Write-Host "  (variable $Name already exists, leaving it alone)" }
}

$organizationId = (appwrite list-organizations --json | ConvertFrom-Json).organizations[0].'$id'
if (-not $organizationId) {
    $organizationId = Read-Host "Could not detect an organization. Please paste your organization Id"
}
Write-Host "Using organization $organizationId"

# Creating the project
appwrite organization create-project --organization-id $organizationId --project-id $projectId --name Resonate

# Creating IOS and Android platforms
appwrite project create-android-platform --project-id $projectId --platform-id android-resonate --application-id com.resonate.resonate --name Resonate
appwrite project create-apple-platform --project-id $projectId --platform-id apple-resonate --bundle-identifier com.resonate.resonate --name Resonate


Set-ProjectVariable APPWRITE_ENDPOINT "http://host.docker.internal:80/v1"

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

Write-Host "---- Appwrite Set Up complete (only functions left)----"

Write-Host "Setting Up MeiliSearch now ..."
# Push MeiliSearch credentials as env variables for functions to use
while ($true) {
    $isLocalDeployment = Read-Host "Do you wish to opt for MeiliSearch Cloud or Host MeiliSearch locally? For Locally: y, For Cloud: n (y/n)"
    if ($isLocalDeployment -eq "y" -or $isLocalDeployment -eq "Y") {
        Write-Host "You chose to host MeiliSearch locally."



        Write-Host "Starting MeiliSearch Server"

        # Command to Start MeiliSearch Server
        docker rm -f meilisearch 2>$null | Out-Null
        docker run -d --name meilisearch `
            -p 7700:7700 `
            -e MEILI_ENV=development `
            -e MEILI_MASTER_KEY=myMasterKey `
            -v ${PWD}/meili_data:/meili_data `
            getmeili/meilisearch:latest

        $meilisearchEndpoint = "http://host.docker.internal:7700"
        $meilisearchMasterKey = "myMasterKey"
        break

    }
    elseif ($isLocalDeployment -eq "n" -or $isLocalDeployment -eq "N") {
        Write-Host "You chose to use MeiliSearch Cloud."
        Write-Host "Please follow the steps on the Guide to Set Up MeiliSearch Cloud, hence getting your self MeiliSearch host url, master key"
        $meilisearchEndpoint = Read-Host "Please Provide MeiliSearch Host Url"
        $meilisearchMasterKey = Read-Host "Please Provide MeiliSearch Master key"
        break

    }
    else {
        Write-Host "Invalid input. Please enter 'y' for local or 'n' for cloud."
    }
}

# Push MeiliSearch credentials as env variables for functions to use
Write-Host "Pushing MeiliSearch credentials as env variables if you need any changes do them in your Appwrite Resonate project's Global Env variables"
Set-ProjectVariable MEILISEARCH_ENDPOINT $meilisearchEndpoint
Set-ProjectVariable MEILISEARCH_ADMIN_API_KEY $meilisearchMasterKey


Write-Host "Setting Up Livekit now ..."
# Push Livekit credentials as env variables for functions to use
while ($true) {
    $isLocalDeployment = Read-Host "Do you wish to opt for Livekit Cloud or Host Livekit locally? For Locally: y, For Cloud: n (y/n)"
    if ($isLocalDeployment -eq "y" -or $isLocalDeployment -eq "Y") {
        Write-Host "You chose to host Livekit locally."

        # check if Livekit server already running
        if (docker ps -aq --filter "name=^/livekit$") {
            Write-Host "Livekit Server Already Running Terminating and Starting Again..."
        }
        else {
            Write-Host "Starting Livekit Server"
        }

        # Command to Start Livekit Server
        docker rm -f livekit 2>$null | Out-Null
        docker run -d --name livekit -p 7880:7880 livekit/livekit-server --dev --bind 0.0.0.0

        $livekitHostURL = "http://host.docker.internal:7880"
        $livekitSocketURL = "wss://host.docker.internal:7880"
        $livekitAPIKey = "devkey"
        $livekitAPISecret = "secret"
        break

    }
    elseif ($isLocalDeployment -eq "n" -or $isLocalDeployment -eq "N") {
        Write-Host "You chose to use Livekit Cloud."
        Write-Host "Please follow the steps on the Guide to Set Up Livekit Cloud, hence getting your self Livekit host url, socket url, API key, API secret"
        $livekitHostURL = Read-Host "Please Provide Livekit Host Url"
        $livekitSocketURL = Read-Host "Please Provide Livekit Socket Url"
        $livekitAPIKey = Read-Host "Please Provide Livekit API key"
        $livekitAPISecret = Read-Host "Please Provide Livekit API secret"
        break

    }
    else {
        Write-Host "Invalid input. Please enter 'y' for local or 'n' for cloud."
    }
}
# Push Livekit credentials as env variables for functions to use
Write-Host "Pushing Livekit credentials as env variables if you need any changes do them in your Appwrite Resonate project's Global Env variables"
Set-ProjectVariable LIVEKIT_HOST $livekitHostURL
Set-ProjectVariable LIVEKIT_SOCKET_URL $livekitSocketURL
Set-ProjectVariable LIVEKIT_API_KEY $livekitAPIKey
Set-ProjectVariable LIVEKIT_API_SECRET $livekitAPISecret
appwrite push functions --force --with-variables

# Seed the achievement thresholds.
Write-Host "Seeding achievement thresholds ..."
appwrite functions create-execution --function-id reconcile-achievements
