# Final Project

## Description
This is a REST API built with Node.js, Express, and MongoDB.  
It provides information about U.S. states and allows users to manage fun facts for each state.

## Features
- Get all states
- Filter contiguous/non-contiguous states
- Get state details
- Get random fun facts
- Add, update, and delete fun facts

## Technologies Used
- Node.js
- Express
- MongoDB / Mongoose

## Endpoints

### GET
- /states
- /states?contig=true
- /states/:state
- /states/:state/funfact

### POST
- /states/:state/funfact

### PATCH
- /states/:state/funfact

### DELETE
- /states/:state/funfact

## Author
Sean Campbell