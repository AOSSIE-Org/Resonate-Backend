# sync-upcoming-rooms-with-meilisearch

Sync upcoming rooms and subscribed rooms with Meilisearch for real-time search functionality.

## Features

- Full-text search across room names, descriptions, tags, creator name, and username
- Filter by scheduled date, category, language, and user subscriptions
- Sort by relevance, scheduled date, creation date
- Pagination support
- Handles both upcoming rooms and subscribed rooms collections

## Searchable Attributes

- `roomName` - The name of the room
- `roomDescription` - Detailed description of the room
- `tags` - Array of tags associated with the room
- `creatorName` - Name of the room creator
- `creatorUsername` - Username of the room creator

## Filterable Attributes

- `isLive` - Boolean indicating if room is currently live (always false for this index)
- `scheduledDate` - When the room is scheduled
- `category` - Room category
- `language` - Room language
- `userId` - User ID for filtering subscribed rooms (optional)

## Configuration

This function requires the following environment variables:

- `MEILISEARCH_ENDPOINT` - The URL of your Meilisearch instance
- `MEILISEARCH_ADMIN_API_KEY` - Admin API key for Meilisearch

## Trigger

This function is triggered by Appwrite document events (create, update, delete) on:

- The upcoming rooms collection
- The subscribed rooms collection

## Usage

The function automatically syncs upcoming room documents to Meilisearch when:

- A new upcoming room is created
- An upcoming room is updated
- An upcoming room is deleted
- A user subscribes to a room (subscribed rooms collection)
- A subscribed room is updated
- A user unsubscribes from a room (subscribed rooms collection)
