#!/usr/bin/env sh

projectId="resonate"

ping -c 1 google.com &> /dev/null

# Check the exit status of the ping command
if [ $? -eq 0 ]; then

    # Ask user account credentials
    appwrite login


    # Creating the project
    appwrite projects create --projectId resonate --name Resonate --teamId 666ce18b003caf6274b6


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


    # Get your IP, create endpoint using it and push as environment variable for functions to use
    ip_address=$(ifconfig en0 | awk '/inet / {print $2}')
    appwrite project createVariable --key APPWRITE_ENDPOINT --value "http://$ip_address:85/v1"


    # Set OAuth2 Provider config (Google, Github)
    appwrite projects updateOAuth2 --projectId "$projectId" --provider 'google' --appId "891364995543-j7gai247bpls0t79ai5njn3e8ah1tkei.apps.googleusercontent.com" --secret "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" --enabled true
    appwrite projects updateOAuth2 --projectId "$projectId" --provider 'github' --appId "0f9bb1b7747f8e69608e" --secret "0c850c762d17f3152f5e5cfde4ebe51c5d57c514" --enabled true

    # Pushing the project's core defined in appwrite.json
    appwrite deploy collection
    appwrite deploy function
    appwrite deploy bucket

else
    echo "No internet connection, please connect to a WiFi"
fi

