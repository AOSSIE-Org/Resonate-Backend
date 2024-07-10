Write-Host "Installing Dependencies...."

Invoke-WebRequest -useb https://appwrite.io/cli/install.ps1 | Invoke-Expression


docker run -it --add-host host.docker.internal:host-gateway --rm `
    --volume /var/run/docker.sock:/var/run/docker.sock `
    --volume "$(pwd)/appwrite:/usr/src/code/appwrite:rw" `
    --entrypoint="install" `
    appwrite/appwrite:1.5.7

$projectId = "resonate"

# Remove previous Appwrite Cli data
Remove-Item -Recurse -Force $HOME\.appwrite

# Ask contributor account credentials   
while ($true) {
    appwrite login
    if ($LASTEXITCODE -eq 0) {
        break
    } else {
        Write-Host "Login failed. Please try again."
    }
}

# start ngrok tunnel
Write-Host "Starting Ngrok tunnel to get the url to provide as redirect for Oauth "

while ($true) {
    $ngrokOauthToken = Read-Host "Please provide the ngrok auth token in order to start the tunnel"

    if (-not $ngrokOauthToken) {
        Write-Host "Auth token cannot be empty. Please try again."
        continue
    }

    # Stop any existing ngrok container
    docker stop ngrok | Out-Null
    docker rm ngrok | Out-Null

    # Run the ngrok container
    docker run -d --name ngrok -p 4040:4040 -e NGROK_AUTHTOKEN=$ngrokOauthToken ngrok/ngrok:latest http host.docker.internal:5050

    Start-Sleep -Seconds 2

    if (docker ps | Select-String -Pattern "ngrok") {
        Write-Host "Ngrok tunnel started successfully."
        Start-Sleep -Seconds 1
        $ngrok_url = (Invoke-RestMethod -Uri http://localhost:4040/api/tunnels).tunnels[0].public_url
        Write-Host "ngrok tunnel Domain Name: $ngrok_url"
        break
    } else {
        Write-Host "Failed to start ngrok tunnel. Please try again."
    }
}

Write-Host "Starting resonate project set up...."
# Get team id for project creation
$teamId = Read-Host "Please provide the team Id as instructed in the Resonate Set Up Guide"

# Creating the project
appwrite projects create --projectId resonate --name Resonate --teamId $teamId

# Creating IOS and Android platforms
appwrite projects createPlatform --projectId $projectId --type flutter-android --key com.resonate.resonate --name Resonate
appwrite projects createPlatform --projectId $projectId --type flutter-ios --key com.resonate.resonate --name Resonate

# Creating Server Key and Retrieving it from response
$create_key_response = appwrite projects createKey --projectId $projectId --name "Appwrite Server Key" --scopes 'sessions.write' 'users.read' 'users.write' 'teams.read' 'teams.write' 'databases.read' 'databases.write' 'collections.read' 'collections.write' 'attributes.read' 'attributes.write' 'indexes.read' 'indexes.write' 'documents.read' 'documents.write' 'files.read' 'files.write' 'buckets.read' 'buckets.write' 'functions.read' 'functions.write' 'execution.read' 'execution.write' 'locale.read' 'avatars.read' 'health.read' 'providers.read' 'providers.write' 'messages.read' 'messages.write' 'topics.read' 'topics.write' 'subscribers.read' 'subscribers.write' 'targets.read' 'targets.write' 'rules.read' 'rules.write' 'migrations.read' 'migrations.write' 'vcs.read' 'vcs.write' 'assistant.read'
$secret = ($create_key_response -split ' : ')[1].Trim()
Write-Host $create_key_response
Write-Host $secret

# Pushing Server Key as env variable for cloud functions to use
appwrite project createVariable --key APPWRITE_API_KEY --value $secret

# Push endpoint as environment variable for functions to use (host.docker.internal used to access localhost from inside of script)
appwrite project createVariable --key APPWRITE_ENDPOINT --value "http://host.docker.internal:80/v1"

# Ask contributor for Oauth2 provider config (Google. Github)
Write-Host "Please follow the Set Up Guide on Resonate to create the Oauth2 credentials for Google and Github"

Write-Host "ngrok tunnel Domain Name: $ngrok_url"
$googleAppId = Read-Host "Enter the Google App ID"
$googleSecret = Read-Host "Enter the Google App Secret"
appwrite projects updateOAuth2 --projectId $projectId --provider 'google' --appId $googleAppId --secret $googleSecret --enabled $true

$githubAppId = Read-Host "Enter the GitHub App ID"
$githubSecret = Read-Host "Enter the GitHub App Secret"
appwrite projects updateOAuth2 --projectId $projectId --provider 'github' --appId $githubAppId --secret $githubSecret --enabled $true

# Pushing the project's core defined in appwrite.json
appwrite deploy collection
appwrite deploy function
appwrite deploy bucket

Write-Host "---- Appwrite Set Up complete ----"
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
        Start-Process -FilePath "livekit-server" -ArgumentList "--dev --bind 0.0.0.0" -RedirectStandardOutput livekit.log -RedirectStandardError livekit.log

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
appwrite project createVariable --key LIVEKIT_HOST --value $livekitHostURL
appwrite project createVariable --key LIVEKIT_SOCKET_URL --value $livekitSocketURL
appwrite project createVariable --key LIVEKIT_API_KEY --value $livekitAPIKey
appwrite project createVariable --key LIVEKIT_API_SECRET --value $livekitAPISecret

Write-Host "Starting Caddy Web-Server to serve as a proxy to redirect traffic from one tunnel to two services i.e appwrite livekit"

Write-Host "Creating Caddy file"
$caddyfileContent = @"
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
"@
Write-Host "Caddyfile created successfully."

# Run Caddy server in a Docker container
docker stop caddy 2>$null; docker rm caddy 2>$null
docker run -d --name caddy -p 5050:5050 -v ${PWD}/Caddyfile:/etc/caddy/Caddyfile -v caddy_data:/data caddy

Write-Host "Your ngrok tunnel domain: $ngrok_url"
Write-Host "For ngrok logs visit http://localhost:4040"