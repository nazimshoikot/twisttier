const {
  check,
  validationResult
} = require('express-validator');
const db = require('./dbFunctions');
const extFuncs = require('./helpers.js');
const express = require('express');


// @brief: middleware to create a post. sets 'error' header if
//         errors occur
// @return: none
async function createSpin(req, res, next) {
  if (extFuncs.check_errors(req, res)) {
    return next();
  }

  var spin = {
    content: req.body.spinBody,
    tags: req.body.tags,
    edited: false,
    likes: 0,
    quotes: 0,
    is_quote: req.body.is_quote,
    quote_origin: req.body.quote_origin, // TODO define how this works I still don't understand the whole quote origin thing
    like_list: []
  };

  // if it is a quote but no original author is specified, error
  if (spin.is_quote && spin.quote_origin === undefined) {
    res.setHeader("error", "no quote origin specified");
    return next();
  }


  var added = await db.addSpin(req.params.username, spin);
  console.log(added);
  if (!added) {
    res.setHeader("error", "unable to add spin");
  } else {
    res.setHeader("spinId", added);
  }
  return next();
}

// @brief: middleware to edit a post. sets 'error' header if errors occur
// @return: none
async function editSpin(req, res, next) {
  if (extFuncs.check_errors(req, res)) {
    return next();
  }

  var spin = {
    content: req.body.spinBody,
    tags: req.body.tags,
    id: req.body.spinID
  };

  var updated = await db.updateSpin(req.params.username, spin);
  console.log("Returned spin id:", updated);
  if (!updated) {
    res.setHeader("error", "unable to edit spin");
  } else {
    res.setHeader("spinID", updated);
  }
  return next();
}

// @brief: middleware to delete a post. sets 'error' header if
//         errors occur
// @return: none
async function removeSpin(req, res, next) {
  if (extFuncs.check_errors(req, res)) {
    return next();
  }
  var username = req.params.username
  var spin_id = req.body.spinId;

  var deleted = await db.deleteSpin(username, spin_id);
  if (!deleted) {
    res.setHeader("error", "unable to delete spin");
  } else {
    res.setHeader("spinId", deleted);
  }
  return next();
}


async function esteemSpin(req, res, next) {
  const esteem = req.body
  console.log(esteem);
  var liker = esteem.liker;
  var author = esteem.postAuthor;
  var spinId = esteem.spinID;
  var action = esteem.action;
  // console.log(esteem);
  // console.log(liker, author, spinId, action);

  var result;

  if (action === 'like') {
    result = await db.likeSpin(liker, author, spinId);
  }
  else if (action === 'unlike') {
    result = await db.unlikeSpin(liker, author, spinId);
  }

  // if the action was not able to be completed, set an error header and return next
  // else send the post and die
  console.log(result);

  if (!result) {
    res.setHeader('error', 'unable to ' + action + ' post');
    return next();
  }
  else {
    res.json(JSON.stringify(result));
  }
}

async function getspin(req, res, next)
{
  // console.log(req.body);
  var username = req.params.username;
  var spinid = req.body.spinID;

  var result = await db.getSingleSpin(username, spinid);

  if (!result)
  {
    console.log('error', 'unable to get spin ' + spinid.toString() + " from " + username);
    res.setHeader('error', 'unable to get spin ' + spinid.toString() + " from " + username);
    return next();
  }
  else
  {
    // console.log('got spin', spinid, 'from', username);
    res.json(JSON.stringify(result));
  }
}

module.exports = {
createSpin,
removeSpin,
esteemSpin,
editSpin,
getspin,
}