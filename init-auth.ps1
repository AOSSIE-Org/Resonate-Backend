# Rn this file contains chunks of commands that could help get the auth initialisation set up quickily


# Write-Host "Installing devtunnels"

# Invoke-WebRequest -Uri https://aka.ms/TunnelsCliDownload/win-x64 -OutFile devtunnel.exe
# .\devtunnel.exe -h

# while ($true) {
#     devtunnel login
#     if ($LASTEXITCODE -eq 0) {
#         break
#     } else {
#         Write-Host "devtunnel login failed. Please try again."
#     }
# }

# function Check-Status {
#     param ($processName)

#     if ($LASTEXITCODE -ne 0) {
#         Write-Host "Error: $processName failed to start. Exiting script."
#         exit 1
#     }
# }

# # Start the first devtunnel on port 80
# Write-Host "Starting devtunnel on port 80..."
# Start-Process "devtunnel" -ArgumentList "host -p 80 --allow-anonymous --protocol http --host-header unchanged" -NoNewWindow -RedirectStandardOutput $null -RedirectStandardError $null
# Start-Sleep -Seconds 2
# Check-Status "devtunnel on port 80"

# # Start the second devtunnel on port 7880
# Write-Host "Starting devtunnel on port 7880..."
# Start-Process "devtunnel" -ArgumentList "host -p 7880 --allow-anonymous --protocol http --host-header unchanged" -NoNewWindow -RedirectStandardOutput $null -RedirectStandardError $null
# Start-Sleep -Seconds 2
# Check-Status "devtunnel on port 7880"

# Write-Host "Both devtunnels started successfully."

# # Get the list of active tunnels and extract the URLs
# Write-Host "Fetching the list of active tunnels"
# $tunnel_list = devtunnel list

# Write-Host $tunnel_list

# # Extract tunnel IDs from the list
# $tunnel_ids = $tunnel_list -match '\b[a-z0-9-]*\.inc1\b' | ForEach-Object { $_.Matches.Value }

# # Split the IDs into individual variables if needed
# $tunnel_id_1 = $tunnel_ids[0]
# $tunnel_id_2 = $tunnel_ids[1]

# # Output the extracted tunnel IDs
# Write-Host "Tunnel ID for Appwrite: $tunnel_id_1"
# Write-Host "Tunnel ID for Livekit: $tunnel_id_2"


# Ask contributor for Oauth2 provider config (Google. Github)
# Write-Host "Please follow the Set Up Guide on Resonate to create the Oauth2 credentials for Google and Github"

# Write-Host "ngrok tunnel Domain Name: $ngrok_url"
# $googleAppId = Read-Host "Enter the Google App ID"
# $googleSecret = Read-Host "Enter the Google App Secret"
# appwrite projects update-o-auth-2 --project-id $projectId --provider 'google' --appId $googleAppId --secret $googleSecret --enabled $true

# $githubAppId = Read-Host "Enter the GitHub App ID"
# $githubSecret = Read-Host "Enter the GitHub App Secret"
# appwrite projects update-o-auth-2 --project-id $projectId --provider 'github' --appId $githubAppId --secret $githubSecret --enabled $true
