# student-simulator-backend

This is a simple Node.js Express server.

## Setup

Follow these steps to setup the project:

1. **Install Dependencies**: Run `npm install` to install all the necessary dependencies.

2. **Start the Server**: Run `npm run dev` to start the server with `nodemon` which will automatically reload the server whenever you save a file.

## API Endpoints

The server has the following API endpoints:

- `GET /`: Returns a simple "Hello World!" message.
- `POST /api/data`: Logs the request body to the console and echoes it back in the response.

## Testing the Server

You can test the server using a tool like Postman or curl. Here's an example of how to do this with curl:

```bash
# Test the GET / route
curl http://localhost:3000/

# Test the POST /api/data route
curl -X POST -H "Content-Type: application/json" -d '{"key":"value"}' http://localhost:3000/api/data
