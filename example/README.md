# Auth0 + Socket.io

This is the seed project you need to use if you're going to create a Socket.io single page app that will use Auth0.

## Running the example

In order to run the example, you need to have `node` installed. 

You also need to set the ClientSecret, ClientId and Domain for your Auth0 app as variables with the following names respectively: `AUTH0_CLIENT_SECRET`, `AUTH0_CLIENT_ID` and `AUTH0_DOMAIN`.

````bash
# auth0-variables.js file
AUTH0_CLIENT_SECRET=myCoolSecret
AUTH0_CLIENT_ID=myCoolClientId
AUTH0_DOMAIN=samples.auth0.com
````
1. run npm install 
1. run node index.js in the directory of this project.

Go to [http://localhost:3001](http://localhost:3001) and you'll see the app running :).
