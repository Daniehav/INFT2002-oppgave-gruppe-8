# QA Platform

This is a application which gives you the ability to ask and answer questions. 

## Setup database connections

The following section describes how to set up the database for the application

### Use existing database connection

In the source code an existing database connection is configured. Use this configuration to use the existing databases for the application and the tests.

### Create new database

To be able to run the QA Platform you need one database for the application and one for the tests.

Start by creating two new databases. In each database create the tables defined in `resources/database.sql`. This can for example
be done with phpmyadmin.

There are two configuration files that contain the database connection details. One for the application and one for the tests, and the the files are as listed below.
Update them to configure the application according to your databases and credentials.

`server/config.ts`:

```ts
process.env.MYSQL_HOST = 'mysql.stud.ntnu.no';
process.env.MYSQL_USER = 'YOUR_USER_NAME';
process.env.MYSQL_PASSWORD = 'YOUR_PASSWORD';
process.env.MYSQL_DATABASE = 'YOUR_DATABASE';
```

`server/test/config.ts`:

```ts
process.env.MYSQL_HOST = 'mysql.stud.ntnu.no';
process.env.MYSQL_USER = 'YOUR_USER_NAME';
process.env.MYSQL_PASSWORD = 'YOUR_PASSWORD';
process.env.MYSQL_DATABASE = 'YOUR_DATABASE';
```

## Prerequisites

To run the application you need Node.js with npm installed

## Run the application


Do the following to run the QA platform application

### Start the server and the client

In one terminal run the following to install dependencies and to start the server:

```sh
cd server
npm install
npm start
```

In one terminal do the following to start the client:

```sh
cd client
npm install
npm start
```

You can now navigate to http://localhost:3000/ in a web browswer to see the QA Platform application

## Tests:

The following section describes running tests.

### Run server tests

Run the following in a terminal to run server tests:

```sh
cd server
npm test
```

### Run client tests:

Run the following in a terminal to run client tests:

```sh
cd client
npm test
```
