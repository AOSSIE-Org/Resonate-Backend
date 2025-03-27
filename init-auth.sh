# Rn this file contains chunks of commands that could help get the auth initialization set up quickly

## Install devtunnel command for macOS
# brew install --cask devtunnel

# Install devtunnel command for linux
# curl -sL https://aka.ms/DevTunnelCliInstall | bash

## Devtunnel login command
# while true; do
#     devtunnel login
#     if [ $? -eq 0 ]; then
#         break
#     else
#         echo "devtunnel login failed. Please try again."
#     fi
# done



## Start Devtunnels and get the Url's
# check_status() {
#     if [ $? -ne 0 ]; then
#         echo "Error: $1 failed to start. Exiting script."
#         exit 1
#     fi
# }
# Start the first devtunnel on port 80
# echo "Starting devtunnel on port 80..."
# devtunnel host -p 80 --allow-anonymous --protocol http --host-header unchanged > /dev/null 2>&1 &
# check_status "devtunnel on port 80"

# # Start the second devtunnel on port 7880
# echo "Starting devtunnel on port 7880..."
# devtunnel host -p 7880 --allow-anonymous --protocol http --host-header unchanged > /dev/null 2>&1 &
# check_status "devtunnel on port 7880"

# sleep 2

# echo "Both devtunnels started successfully."

# Get the list of active tunnels and extract the URLs
# echo "Fetching the list of active tunnels"
# tunnel_list=$(devtunnel list)

# echo $tunnel_list
# tunnel_ids=$(echo "$tunnel_list" | grep -o '\b[a-z0-9-]*\.inc1\b')

# # Split the IDs into individual variables if needed
# tunnel_id_1=$(echo "$tunnel_ids" | sed -n '1p')
# tunnel_id_2=$(echo "$tunnel_ids" | sed -n '2p')

# # Output the extracted tunnel IDs
# echo "Tunnel ID for Appwrite: $tunnel_id_1"
# echo "Tunnel ID for Livekit: $tunnel_id_2"


## Start initializing Auth

# Ask contributor for Oauth2 provider config (Google. Github)
# echo "Please follow the Set Up Guide on Resonate to create the Oauth2 credentials for Google and Github"

# read -p "Enter the Google App ID: " googleAppId
# read -p "Enter the Google App Secret: " googleSecret
# appwrite projects update-o-auth-2 --project-id "$projectId" --provider 'google' --appId "$googleAppId" --secret "$googleSecret" --enabled true

# read -p "Enter the GitHub App ID: " githubAppId
# read -p "Enter the GitHub App Secret: " githubSecret
# appwrite projects update-o-auth-2 --project-id "$projectId" --provider 'github' --appId "$githubAppId" --secret "$githubSecret" --enabled true