const express = require('express');

function checkerrors(res)
{
  var err = res.getHeader('error');
  if (err != undefined)
  {
    return ', ' + err.toString(); 
  }
  return "";
}

function validEmail(req, res, next)
{
  // console.log('email validator', req.body);
  var emailexp = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  var email = req.body.email;
  // console.log(email);
  if (email === undefined)
  {
    res.setHeader('error', 'invalid email - none provided' + checkerrors(res));
    return next();
  }
  var valid = email.match(emailexp);
  if (!valid)
  {
    res.setHeader('error', 'invalid email' + checkerrors(res));
  }
  return next();
}

function validName(req, res, next)
{
  var name = req.body.name;
  if (name === undefined)
  {
    res.setHeader('error', 'invalid name - none provided' + checkerrors(res));
    return next();
  }
  name = name.trim();
  const len = name.length;
  if (len < 1 || len > 25)
  {
    res.setHeader('error', 'invalid name' + checkerrors(res));
  }
  return next();
}

function validBio(req, res, next)
{
  var bio = req.body.bio;
  if (!bio)
  {
    req.body.bio = "";
    bio = '';
  }
  var len = bio.length;
  if (len > 150)
  {
    res.setHeader('error', 'bio is too long' + checkerrors(res));
  }
  return next();
}

function validUsername(req, res, next)
{
  var username = req.body.username;
  if (!username)
  {
    res.setHeader('error', 'invalid username - none provided' + checkerrors(res));
    return next();
  }
  var len = username.length;

  if (len < 1 || len > 15)
  {
    res.setHeader('error', 'invalid username' + checkerrors(res));
  }
  return next();
}

function validSpin(req, res, next)
{
  var spinbody = req.body.spinBody;
  if (spinbody === undefined)
  {
    res.setHeader('error', 'invalid spin' + checkerrors(res));
    return next();
  }
  if (spinbody.length < 1 || spinbody.length > 90)
  {
    res.setHeader('error', 'spin is not a valid length.' + checkerrors(res));
    return next();
  }
  if (req.body.is_quote && !req.body.quote_origin)
  {
    res.setHeader('error', 'invalid post, no origin for quote provided' + checkerrors(res));
  }
  return next();
}

function validPassword(req, res, next)
{
  var password = req.body.password;
  if (!password)
  {
    res.setHeader('error', 'invalid password' + checkerrors(res));
    return next();
  }

  if (password.length < 8)
  {
    res.setHeader('error', 'password too short' + checkerrors(res));
  }
  return next();
}

module.exports = {
  validEmail,
  validUsername,
  validSpin,
  validBio,
  validName,
  validPassword,
}