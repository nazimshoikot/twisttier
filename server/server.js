const express = require('express');
const session = require('client-sessions');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const db = require('./dbFunctions');

const { check, validationResult } = require('express-validator');

const dotenv = require('dotenv');
const users = require('./accountFunctions.js');
const spins = require('./spinMiddlewares.js');
const index = path.join(__dirname, '../build/index.html');
const helpers = require('./helpers.js');
const helmet = require('helmet');
const validator = require('./data_validators');



const init = require('./config.json');
const root = path.join(__dirname, "../build");
const images = path.join(__dirname, '../profileImages');

const port = process.env.PORT || 8080;

const app = express();

app.use(session(init.sessionSetup));
app.use(cookieParser());
app.use(helmet());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../build/')));
app.use(helpers.cloudinaryConfig);

app.listen(port, (err) => {
  if (err) throw err;
  console.log('Server started on port', port);
  db.bootClearNewPosts(null, null, () => {console.log('cleared new posts column')});
});

if (process.env.TEST === 'true')
{
  app.get('/testgarbage', [validator.validEmail, validator.validName, validator.validUsername], (req, res) =>
  {
    console.log('fdjsklahjdslk')
    console.log(res.getHeader('error'));
  });
}
  
// TODO fix express-validator
// handle user creation
// [check('email').isEmail().withMessage('invalid email'),
//   check('password').isLength({ min: 8 }).withMessage('password too short'),
//   check('bio').isLength({ max: 150 }).withMessage('bio too long'),
//   check('name').isLength({ max: 25, min: 1 }).withMessage('invalid name'),
//   check('username').isLength({ max: 15, min: 1 }).withMessage('invalid username')
// ],
app.post('/create_user', helpers.notLoggedIn, helpers.multerUpload, helpers.cloudinaryUpload,
  [validator.validEmail,
    validator.validName,
    validator.validUsername,
    validator.validBio,
    validator.validPassword], users.postCreateUser, (req, res) => {
    // console.log(validationResult(req));
      console.log(req.body);
    if (res.getHeader('error') != undefined) {
      console.log('error detected in profile creation', res.getHeader('error'));
      
      res.status(406).send(res.getHeader('error'));
    } 
    else {
      helpers.createSession(req, res);
      // res.sendFile(index);
      console.log(res.userData);
      res.json(JSON.stringify(res.userdata));
    }

  });


if (process.env.TEST === 'true')
{
  // handle profile image uploading
  // THIS IS NOW EXPLICITLY FOR TESTING PURPOSES
  // @param req: the html headers which will include
  //              a json with the user information
  // @param res: response to client
  //             will return 406, Not acceptable to the client
  app.post('/uploadProfileImage',  helpers.multerUpload, helpers.cloudinaryUpload, (req, res, next) => {
    // console.log(req.file);
    if (!req.file || res.getHeader('error') != undefined) {
      res.status(418).send('idk wtf is wrong');
    }
    else {
      res.status(200).send("good job you uploaded a picture " + JSON.stringify(req.file.path));
    }
  });
}

// TODO send responses to front based on login / logout
app.get('/logout', helpers.loggedIn, (req, res) => {
  console.log(req.clientSession.uid, 'is logging out');
  // console.log(req.cookies);
  helpers.deleteSession(req, res);
  res.redirect('/'); // redirect to home page
});

// @brief: route handler for checking if a user is logged in
//         will redirect to / if already logged in, otherwise
//         will continue to login page
app.get('/login', helpers.notLoggedIn, (req, res) => {
  console.log('GET /login');
  res.sendFile(index);
});

// @brief: route handler for checking if a user is logged in
//         will redirect to / if already logged in, otherwise
//         will continue to login page
app.get('/signup', helpers.notLoggedIn, (req, res) => {
  console.log('GET /signup');
  res.sendFile(index);
});

// TODO add express-validator for empty fields here
// @brief: endpoint to actually handle the login request for a user
app.post('/login', helpers.notLoggedIn, users.authorize, (req, res) => {
  // if the authorize function signals an error, send an unauthorized message
  console.log(req.body.username || req.body.email, 'logging in');
  if (res.getHeader('error')) {
    // console.log(res);
    res.status(401)
    res.sendFile(index);
  } 
  else {
    helpers.createSession(req, res);
    res.json(JSON.stringify(res.userdata));
    // res.sendFile(index);
  }
});

// @brief: endpoint for querying the logged in status of a user
// @response: header loggedIn: true and cookie loggedIn=true if user is logged in, otherwise
//            these valuse will be false
app.post('/api/login_status', (req, res) => {
  if (req.clientSession.uid && req.cookies.loggedIn){
    helpers.createSession(req, res);
  }
  else {
    helpers.deleteSession(req, res);
  }
  res.sendFile(index);
});


// @brief: endpoint to get a supplied user's profile information
app.post('/api/users/:username', users.getUserInfo, (req, res) => {
  // console.log('POST /api/users/' + req.params.username)
  if (res.getHeader('error') != undefined) {
    res.status(406);
    res.sendFile(index);
  }
});


// @brief: get a supplied user's timeline
// @respond: json with posts made if user exists,
//           404 not found error if user not exist
app.post('/api/timeline/:username', users.getTimeline, (req, res) => {
  if (res.getHeader('error') != undefined) {
    res.status(404).send('user page not found');
  }
  
});

app.post('/api/spin/:username', spins.getspin, (req, res) => {
  var error = res.getHeader('error');
  // console.log(req.body);
  if (error != undefined)
  {
    res.status(404);
    res.sendFile(index);
  }
});

// @brief: get a supplied user's posts
// @respond: json with posts made if user exists,
//           404 not found error if user not exist
app.post('/api/posts/:username', users.getPosts, (req, res) => {
  // console.log(res);
  if (res.getHeader('error') != undefined) {
    res.status(404)
    res.sendFile(index);
  }
});

// @brief: endpoint for the following api
// @return: leave me alone
app.post('/api/updateFollowing', helpers.loggedIn, users.updateFollowing, (req, res) => {
  if (res.getHeader('error')) {
    res.status(418).sendFile(index);
  }
});

// @brief: update a user's profile information
// @respond: IDK man i'm tired
// helpers.loggedIn,
// [check('bio').isLength({ max: 150 }).withMessage('bio too long'),
  // check('name').isLength({ min: 1, max: 25 }).withMessage('invalid name'), ],
app.post('/api/update/:username', helpers.multerUpload, helpers.cloudinaryUpload, 
        [validator.validBio,
         validator.validName],
         users.updateProfileInfo, (req, res) => {
  
  if (res.getHeader('error') != undefined) {
    console.log(res.getHeader('error'));
    res.status(406).sendFile(index);
  }
  // i'm just hacking this together at this point i want to sleep

});


// @brief: endpoint for creating a spin. user must be logged in or this will not work.
app.post('/api/add_spin/:username', helpers.loggedIn,
        [validator.validSpin], spins.createSpin, (req, res) => {
  var error = res.getHeader('error');

  if (error != undefined) {
    res.status(418)
    console.log(error);
  }
  res.sendFile(index);
});

// @brief: endpoint for editing a spin. user must be logged in or this will not work.
app.post('/api/edit_spin/:username', helpers.loggedIn,
        [validator.validSpin], spins.editSpin, (req, res) => {
  var error = res.getHeader('error');

  if (error != undefined) {
    res.status(418)
    console.log(error);
  }
  res.sendFile(index);
});

app.post('/api/deleteSpin/:username', helpers.loggedIn, spins.removeSpin, (req, res) => {

  if (res.getHeader('error') != undefined) {
    res.status(418)
  }
  res.sendFile(index);
});


// @brief: endpoint for liking and unliking a spin.
app.post('/api/spins/esteem', helpers.loggedIn, spins.esteemSpin, (req, res) => {
  if (res.getHeader('error')) {
    res.status(400).send('bad request');
  }
});

// @brief:  endpoint for deleting account
// @author: Chris Fallon
// helpers.loggedIn,
app.post('/api/delete', helpers.loggedIn, users.deleteAccount, (req, res) => {

  if (res.getHeader('error') != undefined) {
    console.log(res.getHeader('error'));
    res.status(406);
    res.sendFile(index);
  } 
  else {
    console.log('deleting session', req.clientSession)
    helpers.deleteSession(req, res);
    res.redirect('/'); // redirect to home page
  }
});


// TODO implement this endpoint and middlewares associated.
app.post('/api/search/:user', users.search, (req, res) => {
  if (res.getHeader('error'))
  {
    res.status(404);
    res.sendFile(index);
  }
});


// wtf this actually fricken fixed it i am PISSED
// TODO limit to non user pages, other pages are assumed to be user pages
// NOTE MUST REMAIN AT THE BOTTOM OF THE FILE OTHERWISE OTHER ROUTES WILL NOT WORK
app.get('/*', (req, res) => {

  console.log('GET', req.originalUrl);
  res.sendFile(index);
});


app.use((err, req, res, next) => {
  // TODO implement a log file for errorsthro
  console.log('The server encountered an error', err.stack)
  res.status(500).send('The server encountered an error');
  throw err;

});
