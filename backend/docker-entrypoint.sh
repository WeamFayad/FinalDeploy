#!/bin/bash
# Start MongoDB
mongod --fork --logpath /var/log/mongodb.log

# Start your Node.js app
nodemon index.js
