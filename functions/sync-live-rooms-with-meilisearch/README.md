# sync-live-rooms-with-meilisearch

Sync live rooms with Meilisearch for real-time search functionality.

## Features

- Full-text search across room names, descriptions, tags, creator name, and username
- Filter by category and language
- Sort by relevance, creation date
- Pagination support
- Automatically syncs only live rooms (isLive = true)

## Searchable Attributes

- `roomName` - The name of the room
- `roomDescription` - Detailed description of the room
- `tags` - Array of tags associated with the room
- `creatorName` - Name of the room creator
- `creatorUsername` - Username of the room creator

## Filterable Attributes

- `isLive` - Boolean indicating if room is currently live (always true for this index)
- `category` - Room category
- `language` - Room language

## Configuration

This function requires the following environment variables:

- `MEILISEARCH_ENDPOINT` - The URL of your Meilisearch instance
- `MEILISEARCH_ADMIN_API_KEY` - Admin API key for Meilisearch

## Trigger

This function is triggered by Appwrite document events (create, update, delete) on the live rooms collection.

## Usage

The function automatically syncs live room documents to Meilisearch when:

- A new live room is created
- A live room is updated
- A live room is deleted
