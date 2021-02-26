const db = require('./dbFunctions');
const bcrypt = require('bcrypt');
const extFuncs = require('./helpers.js');
const path = require('path');
const express = require('express');



// checking new push
// @desc: express middleware function to interface with the database
// @return: none
async function postCreateUser(req, res, next) {

  // TODO figure out why express-validator isnt working
  if (extFuncs.check_errors(req, res)) {
    return next();
  }


  var profile_pic_path = '';
  // if there is a file then add it to the thing
  console.log(req.file);
  console.log(req.file);
  if (req.file != undefined && req.file.path != undefined) {
    profile_pic_path = req.file.path;
  }
  console.log('profile picture located at', profile_pic_path);

  var accountInfo = {
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
    username: req.body.username,
    bio: req.body.bio,
    profile_pic: profile_pic_path
  };

  // check if the user exists already
  var existing = await db.userExists(accountInfo);
  if (existing != false) {
    console.log(accountInfo.username + ' already exists')
    // because of the way that this works, it will upload a profile image first.
    // if the image gets uploaded but the username already exists, then we want to
    // delete the image that got uploaded so we don't just rack up tons of files
    // and get DDoSed
    res.setHeader('error', accountInfo.username + ' user exists');
    extFuncs.delete_profile_img(accountInfo.profile_pic);
    return next(); // return the rows
  }

  var userCreated = await db.createUser(accountInfo);

  // userCreated is the empty rows or false, return error
  if (!userCreated.username) {
    // console.log(userCreated);
    res.setHeader('error', userCreated);
  }
  else {
    res.userdata = userCreated;
    res.setHeader('username', userCreated.username);
  }
  return next();
}

// @desc: function used for logging in (idk why its not called login but whatever)
// @return: none
//          sends response 401 unauthorized with a set header specifying what went wrong
async function authorize(req, res, next) {
  const user = {
    username: req.body.username,
    password: req.body.password,
    email: req.body.email
  };
  // console.log("body =", req.body);

  if (!user.password && !user.username || !user.password && !user.email) {
    res.setHeader('error', 'invalid user');
    return next();
  }

  // console.log(user);

  var userData = await db.userExists(user);
  //console.log(userData);

  if (userData === false) {
    console.log('invalid username');
    res.setHeader('error', 'Username invalid');
    return next();
  }
  try {
    var match = await bcrypt.compare(user.password, userData.passhash);
  }
  catch (e) {
    console.log('exception occurred in authorize: ', e);
    res.setHeader('error', "unable to authorize");
    return next();
  }
  // console.log(match);
  // password doesn't match
  if (!match) {
    console.log('invalid password');
    res.setHeader('error', 'Incorrect Password');
  }
  else {
    if (typeof user.username === 'undefined' || user.username === "") {
      //1st index is the username
      user.username = userData.username;
    }
    // attempt to update the user's last login time
    const updateLoginTimeBool = await db.updateLoginTime(user);

    // check whether login time was successfully updated
    if (!updateLoginTimeBool) {
      console.log('Login time could not be updated');
      res.setHeader('error', 'Login time could not be updated');
    }
  }
  // console.log(userData);
  res.userdata = {
    username: userData.username,
    profile_pic: userData.profile_pic,
    last_login: userData.last_login,
  };
  res.setHeader('username', userData.username);
  return next();

}

// checks whether the account to be deleted exists or not, deletes it,
// returns error or success response
async function deleteAccount(req, res, next) {
  // extract info from the request
  console.log('deleting', req.body.username);
  const user = {
    username: req.body.username,
    password: req.body.password,
    email: req.body.email
  };
  // console.log("user =", user);
  var userData = await db.userExists(user);
  // console.log(userData);
  try {
    if (!user.username || !user.password || !user.email)
    {
      res.setHeader('error', 'invalid data provided: empty fields will not be tolerated, sir. Fix your junk.');
      return next();
    }
    else if (user.email != userData.email)
    {
      res.setHeader('error', 'unable to delete account: invalid email provided')
      return next();
    }
    var goodPass = await bcrypt.compare(user.password, userData.passhash);
  }
  catch (e) {
    console.log('exception occurred while deleting account:', e);
    res.setHeader('error', 'deletion failed');
    return next();
  }
  // check if the user exists
  // if it exists, call the delete user function of db
  // goodPass=true;
  if (userData !== false && goodPass) {

    var deleteSuccess = await db.deleteUser(req.body.username);

    if (deleteSuccess) {
      extFuncs.delete_profile_img(userData.profile_pic);
      return next();
    }
    else {
      res.setHeader('error', 'deletion failed');
    }
  }
  else {
    res.setHeader('error', 'deletion failed: bad password');
  }
  return next();
}

// API for frontend development
async function getUserInfo(req, res, next) {
  // console.log('get user info')
  var user = {
    // send the username as a url parameter ex: /api/users/bringMeDeath
    username: req.params.username,
  }

  var data = await db.userExists(user);
  if (!data) {
    res.setHeader('error', 'user not found');
  }
  else {
    // protect certain information such as password
    var responseObject = {
      username: data.username,
      bio: data.bio,
      create_date: data.create_date,
      last_login: data.last_login,
      name: data.name,
      followers: data.followers,
      following: data.following,
      interests: data.interests,
      profile_pic: data.profile_pic,
      tags_associated: data.tags_associated,
      new_tag_posts: data.new_tag_posts
    };
    // console.log(responseObject);
    // TODO change this to not be a .json response
    // need to get clever with how to send response back
    res.json(JSON.stringify(responseObject));

  }
  // console.log(res);
  return next();
}


// @brief: copy pasta from getTimeline because I am lazy
//         same thing, but does a hack which converts the
//         user list to a following list.
async function getPosts(req, res, next) {
  var user = {
    username: req.params.username,
  };
  // get user's data
  var data = await db.userExists(user);

  if (data === false) {
    res.setHeader('error', 'user not found');
    return next();
  }
  // idk why i do json.stringify here
  var request = JSON.stringify([{
      username: user.username,
      tags: []
    }]);
  var spins = await db.getSpins(null, request);

  if (!spins || spins.length === 0) {
    res.setHeader('alert', 'no spins found :(');
  }
  // console.log(spins);
  res.json(JSON.stringify(spins));
  // return next();

  // TODO error check here and make sure that it returns good data
}

// @brief: generic get timeline function
//         will also be used for when typing in a user's username in
//         the address bar. this wont work i don't think
async function getTimeline(req, res, next) {
  var user = {
    username: req.params.username,
  };
  // get user's data
  var data = await db.userExists(user);

  if (data === false) {
    res.setHeader('error', 'user not found');
    return next();
  }
  // console.log(data);
  // console.log(data.following.users);
  var following = JSON.stringify(data.following.users);
  // console.log(following);

  var followedSpins = await db.getSpins(user.username, following);

  if (req.clientSession.uid != user.username)
  {
    followedSpins.newtagposts = [];
  }
  // console.log(followedSpins);

  if (!followedSpins || followedSpins.length === 0) {
    res.setHeader('alert', 'no spins found :(')
    // return next();
  }
  // console.log(followedSpins);
  res.json(JSON.stringify(followedSpins));
  // return next();
}

// updates user profile information from request
async function updateProfileInfo(req, res, next) {

  if (extFuncs.check_errors(req, res)) {
    return next();
  }
  var imgsrc = '';

  if (req.file && req.file.path) {
    imgsrc = req.file.path;
  }
  var user = {
    username: req.params.username,
    password: req.body.password,
    bio: req.body.bio,
    name: req.body.name,
    interests: JSON.parse(req.body.interests),
    accessibility_features: JSON.parse(req.body.accessibility_features),
    profile_pic: imgsrc
  };
  // console.log(req.params, "\n", req.body, "\n", user);

  // get user's profile data so i can be lazy
  console.log('updating', user.username, '\'s profile');
  var userData = await db.userExists(user);

  if (!userData) 
  {
    res.setHeader('error', "unable to update");
    console.log('unable to update user idk what happened');
    if (req.file != undefined && req.file.path)
    {
      extFuncs.delete_profile_img(req.file.path);
    }
    return next();
  }

  // if no new profile picture is provided, set the new one to be the current one
  if (!user.profile_pic) {
    user.profile_pic = userData.profile_pic;
  }
  // if no password provided, retain old password
  if (user.password && user.password.length === 0)
  {
    user.password = oldPass;
  }
  // if one is provided, set a parameter in the request object to point to the old
  // profile picture path and then delete that image
  else {
    req.imgsrc = userData.profile_pic;
    extFuncs.delete_profile_img(req, res);
  }

  // attempt to update the user's crap
  user.passhash = userData.passhash;
  userData = await db.updateUser(user);

  // if all checking fine, update the user
  if (userData === false) {
    // if use use header, we need to return next
    console.log('user not found in user updating');
    res.setHeader('error', 'user not found');
  }
  else
  {
    res.setHeader('username', userData.username);
    req.imgsrc = userData.profile_pic;
    res.json(JSON.stringify(userData));
  }
  return next();
}

// updates following and followers of two relevant users depending on
// whether the action is follow or unfollow
async function updateFollowing(req, res, next) {
  console.log('updating following for', req.body.follower);
  const action = req.body.action;
  const toFollow = req.body.toFollow;
  const tags = req.body.tags;
  const follower = req.body.follower;
  var followUpdate;
  var user = { username: toFollow };

  // don't allow for following or unfollowing of yourself.
  // console.log("testing: ", follower);
  // console.log("tofollow: ", toFollow);
  if (toFollow === follower) {
    res.setHeader('error', 'nice try bucko you can\'t follow yourself though.');
    return next();
  }

  // make sure tofollow exists probably not necessary.
  const userData = await db.userExists(user);
  if (!userData) {
    res.setHeader('error', toFollow + ' does not exist');
    return next();
  }

  if (action === "follow") {
    followUpdate = await db.followTopicUserPair(follower, toFollow, tags);
  }
  else if (action === "unfollow") {
    followUpdate = await db.unfollowTopicUserPair(follower, toFollow, tags);
  }
  else {
    res.setHeader('error', "invalid action");
    return next();
  }

  if (!followUpdate) {
    res.setHeader('error', "unable to " + action + " " + toFollow);
    return next();
  }
  else if (followUpdate === "Error: nothing changed") {
    // sends alert if he tries to (un)follow something that has already been
    res.setHeader('alert', "unable to " + action + " " + toFollow + "as it has already been done");
    return next();
  }
  else {
    console.log(followUpdate);
    res.json(JSON.stringify(followUpdate));
  }
}

// @brief: middleware for handling the searching for users.
async function search(req, res, next)
{
  console.log('searching for', req.params.user);
  const user = req.params.user;
  // if the parameter is not definec
  if (!user || user === "")
  {
    res.status(406)
    res.setHeader('error', "query cannot be empty");
    return next();
  }

  var results = await db.searchForUser(user);

  if (!results)
  {
    res.status(404);
    res.setHeader('error', "no users found matching that search parameter");
    return next();
  }
  else
  {
    res.json(JSON.stringify(results));
  }
}



module.exports = {
  postCreateUser,
  authorize,
  deleteAccount,
  getTimeline,
  updateProfileInfo,
  getUserInfo,
  getPosts,
  updateFollowing,
  search,
};
