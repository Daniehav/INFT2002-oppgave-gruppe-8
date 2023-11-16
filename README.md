# QA Platform

This is a application which gives you the ability to ask and answer questions. 

## Setup database connections

There are two configuration files that contain the database connection details. These files are as listed below.
Update them to configure the application according to your database

`server/config.ts`:

```ts
process.env.MYSQL_HOST = 'mysql.stud.ntnu.no';
process.env.MYSQL_USER = 'username_todo';
process.env.MYSQL_PASSWORD = 'username_todo';
process.env.MYSQL_DATABASE = 'username_todo_dev';
```

`server/test/config.ts`:

```ts
process.env.MYSQL_HOST = 'mysql.stud.ntnu.no';
process.env.MYSQL_USER = 'username_todo';
process.env.MYSQL_PASSWORD = 'username_todo';
process.env.MYSQL_DATABASE = 'username_todo_test';
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
