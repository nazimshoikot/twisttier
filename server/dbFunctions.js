// file with the main database interaction functions

const credentials = require('./config.json');
const dotenv = require('dotenv').config();
const bcrypt = require('bcrypt');
const unique = require('array-unique');
// import postgres lib
const { Pool } = require("pg");
// create new postgres client pool
const pool = new Pool(credentials.database);

const USER_TABLE = process.env.USER_TABLE || 'USERS';
const SPIN_TEMPLATE = process.env.SPIN_TEMPLATE;
const TEST = (process.env.TEST === "true");
// 5 minutes for testing or 24 hours for deployed environment
const NEW_POST_TIMEOUT = (process.env.NEW_POST_TIMEOUT || 24 * 60 * 60 * 1000);
const reservedTag = require('./config.json').reservedTag;


async function bootClearNewPosts(req, res, next)
{
  try 
  {
    console.log('clearing new tag posts');
    var result = await pool.query(`UPDATE ${USER_TABLE} SET new_tag_posts = NULL`);
    if (result.old) 
    {
      console.log(result.old);
    }
  }
  catch (e)
  {
    console.log("Error encountered in db.bootClearNewPosts:", e);
  }
  return next();
}

// query the database to see if the user exists
// parameter user is object of form {email: [email], username: [username]}
// @return: object of all user's data
var userExists = async function (user) {

  var params = [];
  // console.log(user);
  var query = `SELECT * FROM ${USER_TABLE} `;

  if(user.username)
  {
    query += `WHERE USERNAME=$1`;
    params.push(user.username);
  }
  else if(user.email)
  {
    query += `WHERE EMAIL=$1`;
    params.push(user.email);
  }
  else {
    //Unexpected error here.
    console.log("what the fuck")
    return false;
  }
  // console.log(query, params);
  // console.log('before query')
  var res = await pool.query(query, params);

  // response is a json
  // need to get rows, which is a list
  // console.log(res);
  var rows = res.rows;
  // console.log(rows);
  if (rows.length > 0) {
    // should have only 1 index of the username / email occurring
    // so this is why the [0];
    // console.log(rows[0]);
    return rows[0];
  }
  // return false if they dont already exist, this is good
  return false;
}

// forms the name of the table of individual users
function userSpinTableName(username) {
  var name = username + "_spins";
  return (TEST ? name + "_test" : name);
};

// database function that does all the heavy lifting
// @param accountInfo: object with all the user details from the create account form
// @return: object containing creation info if creation successful, 'unable to create user' if not
 async function createUser(accountInfo) {

  // creates postgres client
  var rows = [];
  var client = await pool.connect();
  try {
    const hash = await bcrypt.hash(accountInfo.password, 10);
    accountInfo.passhash = hash;

    // dynamically create tables based on if this is development or not
    var tablename = userSpinTableName(accountInfo.username);

    var args = [tablename, SPIN_TEMPLATE];

    // begins transaction
    await client.query('BEGIN');

    // create the user table
    var query = `CREATE TABLE IF NOT EXISTS ${tablename} () INHERITS (${SPIN_TEMPLATE})`;

    var res = await client.query(query);

    // console.log(accountInfo);
    args = [
      accountInfo.email,
      accountInfo.username,
      accountInfo.passhash,
      'NOW()',
      'NOW()',
      accountInfo.bio,
      accountInfo.name,
      [], // followers
      // { username: accountInfo.username, tags: [] } 
      {users: [] }, // following
      [], // interests
      {}, // accessibility features
      accountInfo.profile_pic,
      []
    ];

    query = `INSERT INTO ${USER_TABLE} (email,
      username, passhash, create_date, last_login, bio,
      name, followers, following, interests, accessibility_features, profile_pic, tags_associated)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::VARCHAR(15)[], $9::JSON, $10::VARCHAR(20)[], $11::JSON, $12::TEXT, $13::VARCHAR(19)[])
      RETURNING username, profile_pic, last_login`;

    res = await client.query(query, args);
    // console.log("2nd res: ", res.rows);
    // tell server we are done (end of transaction)
    await client.query('COMMIT');

    rows = res.rows;
  }
  catch (e) {
    await client.query('ROLLBACK');
    console.log(`An error occurred in db.createUser: ${e}`);
    return 'unable to create user';
    // return e;
  }
  finally {
    client.release();
  }
  // console.log(rows);

  return (rows.length === 0 ? 'unable to create user' : rows[0]);
};


// function that deletes user info
// this function is to be called after the server has properly authenticated
// @param username: the user's username
// @return deleted username on success, error on failure
async function deleteUser(username){
  var rows = [];
  var client = await pool.connect();
  try{

    var tablename = userSpinTableName(username);

    await client.query('BEGIN');
    var todelete = await client.query(`SELECT * FROM ${USER_TABLE} WHERE USERNAME=$1`, [username]);
    todelete = todelete.rows[0];
    // console.log('todelete =',todelete);

    var follows = [username];
    // get all people who todelete is following
    todelete.following.users.forEach((entrypair, index) => {
      follows.push(entrypair.username);
    });
    // get all people todelete is followed by
    todelete.followers.forEach((user, index) => {
      follows.push(user);
    });
    
    // turn that list into a string because the postgres library sucks balls or I'm just dumb.
    // I'm probably just dumb
    // console.log(follows);
    var followstring = '';
    follows.forEach((user, index) => {
      if (index < follows.length - 1)
      {
        followstring += `'${user}', `;
      }
      else 
      {
        followstring += `'${user}'`;
      }
    })
    console.log(followstring);
    // get who user is following, and who user's followers are
    var query = `SELECT username, followers, following FROM ${USER_TABLE} WHERE USERNAME in (${followstring})`;
    var followingdata = await client.query(query);

    
    followingdata = followingdata.rows;
    console.log(followingdata);
    // return false;

    // for each user in the list, remove the user to be deleted from their follower list,
    // and check if that user follows the person to be deleted. If so, remove them from their
    // following list.
    followingdata.forEach(async (entry, index) => {
      // console.log('initial following:', entry.following.users);
      // remove todelete from x's follower list
      console.log(entry.username,'is followed by', entry.followers);
      entry.followers.splice(entry.followers.indexOf(username), 1);
      console.log('removing', username, 'from', entry.username, "'s follower list:", entry.followers)
      // check if todelete exists in x's following list
      for (var j = 0; j < entry.following.users.length; j++)
      {
        // if the user exists in x's following list, splice the array around that index
        // and break
        if (username === entry.following.users[j].username) 
        {
          console.log(username,'exists in', entry.username,"'s following list", entry.following.users[j]);
          entry.following.users.splice(j, 1);
          break;
        }
      }
      query = `UPDATE ${USER_TABLE} SET followers = $2, following = $1 WHERE username = $3 RETURNING username, following, followers`;
      var args = [entry.following, entry.followers, entry.username];
      
      console.log('updating the database for ', entry.username);
      
      var res = await client.query(query, args);
      console.log(res.rows);
    
     
      console.log('updated following for', entry.username, ':', entry.following.users);
      console.log('updated followers for', entry.username, ':', entry.followers);
      });


    // await client.query('ROLLBACK');
    // return false;

    // delete spin table
    query = `DROP TABLE ${tablename}`;

    var res = await client.query(query);

    query = `DELETE FROM ${USER_TABLE} WHERE username=$1 RETURNING username`;

    // query = `SELECT * FROM ${USER_TABLE} WHERE username=$1`;
    var res = await client.query(query, [username]);
    await client.query('COMMIT');

    rows = res.rows;

  }
  catch (e) {
    await client.query('ROLLBACK');
    console.log(`An error occurred in db.deleteUser: ${ e }`);
    // throw e;
    return false;
  }
  finally {
    client.release();
  }
  // console.log("Rows: ", rows);
  // console.log(rows.length === 0 ? false : rows[0].username);
  return (rows.length === 0 ? false : rows[0].username);

};

// function to update user info (used by edit account)
// returns username, last_login, and profile_pic link of user on success and false on failure
async function updateUser(user) {

  // extract the info to be inserted
  var hash = user.passhash;
  if (user.password != undefined && user.password.length > 0) {
    hash = await bcrypt.hash(user.password, 10);
  }
  
  // connect to database
  var rows = [];
  var client = await pool.connect();
  try {

    // begin transaction
    await client.query('BEGIN');

    var args = [
      user.username,
      hash,
      user.bio,
      user.name,
      user.interests,
      JSON.stringify(user.accessibility_features),
      user.profile_pic
    ];

    var query = `UPDATE ${USER_TABLE} SET passhash = $2, bio = $3, name = $4, interests = $5,
      accessibility_features = $6, profile_pic = $7 WHERE username = $1
      RETURNING username, profile_pic, last_login`
    ;

    if (user.password === undefined) {
      args.splice(1,1);
      query = `UPDATE ${USER_TABLE}
        SET bio = $2, name = $3, interests = $4, accessibility_features = $5, profile_pic = $6
        WHERE username = $1 RETURNING username, profile_pic, last_login`
      ;
    }

    var res = await client.query(query, args);
    rows = res.rows;
    // console.log("ROWS: ", rows);

    // end transaction
    await client.query('COMMIT');
  }
  catch (e) {
    await client.query('ROLLBACK');
    console.log(`An error occurred in db.updateUser: ${e}`);
    return false;
  }
  finally {
    client.release();
  }

  // returns id of user if success otherwise false
  return (rows.length === 0 ? false : rows[0]);
}

// @brief: timer function which will clear any new posts from the
//         user's new posts column
// @param: username: the user's username so it can find the row.
// @return: none
async function clearNewPostColumn(username) {
  var query;
  var client = await pool.connect();
  try {

    client.query("BEGIN");

    query = `UPDATE ${USER_TABLE} SET new_tag_posts = NULL WHERE username = $1 RETURNING username`;

    await client.query(query, [username]);

    await client.query('COMMIT');
  }
  catch (e) {
    console.log('clearNewPostColumn encountered an error: ' + `${e}`);
    await client.query('ROLLBACK');
  }
  finally {
    client.release();
  }

};

// Function to update the last login time
// return true on success, false on error
async function updateLoginTime(user){
  var rows;
  var query = `UPDATE ${USER_TABLE} SET last_login = NOW() WHERE`;
  var arg = '';
  if (!user.username)
  {
    query +=` email = $1 RETURNING username`;
    arg = user.email;
  }
  else {
    query += ` USERNAME = $1 RETURNING username`;
    arg = user.username;
  }
  console.log(query)
  var client = await pool.connect();
  try{

    // console.log(user);
    await client.query('BEGIN');
    // const tablename = userSpinTableName(username);
    var res = await client.query(query, [arg]);
    // var res = await client.query(query);
    rows = res.rows;
    await client.query('COMMIT');
  }
  catch (e) {
    await client.query('ROLLBACK');
    console.log(`An error occurred in db.updateLoginTime: ${e}`);
    return false;
  }
  finally {
    client.release();
  }
  // console.log(res.rows);
  return (rows.length === 0 ? false : true);
};

// @brief get the spins made by a user
// @return list of spins which match the tags supplied
//          if tags are empty then it returns all user spins
async function getSpins(user, users) {
  // add each user to a list of users
  const baseQuery = `SELECT * FROM `;
  var query = '';
  var tagList = []

  var followed;
  var posts = {newtagposts: [], regularposts:[]};
  var res = [];
  var newposts = []; // list of objects : {username: <username>, postid: <postid>}
  var client = await pool.connect();
  try {
    followed = JSON.parse(users);
    // console.log(followed);
    if (followed.length < 1)
    {
      console.log('not following anyone i guess')
      return [];
    }
    // SELECT new_tag_posts from USERS_TABLE where username
    // ful SQL injection vulnerability mode: Engaged
    // for each user in the user list, append their spin table to a query string
    // and also search for tags associated with the supplied followed users list
    // in the followed user's posts
    for (var index = 0; index < followed.length; index++)
    {
      var item = followed[index];
      if (user != null && user === item.username)
      {
        continue;
      }
      // get the post id of the new topic thing idk
      var newpostid = await client.query(
        `SELECT username, new_tag_posts from ${USER_TABLE}
         WHERE username = $1`, [item.username]);
      // console.log('newpost =',newpostid);
      
      newpostid = newpostid.rows[0];

      // if there is a new post found in the column, push an object with its
      // id and username to an array.
      // console.log('newpost =', newpostid);
      if (newpostid && newpostid.new_tag_posts != null)
      {
        newposts.push({ username: newpostid.username, postid: newpostid.new_tag_posts} );
      }
      // select * from <username_spins>
      query += baseQuery + userSpinTableName(item.username);

      // if there is more than just the reserved tag in the tag list then we only search for the list of tags, otherwise we get every tag.
      var where = '';
      if (item.tags.length > 0)
      {
        tagList.push(item.tags);
        // supposed to search in the range of a list supplied
        // hopefully postgres decides to parse this correctly
        // select * from <username_spins> where @> tags
        // console.log('tags =', item.tags);
        where = ' WHERE ';

        //  for each tag in the tag list, append it to a where statement

        item.tags.forEach((tag, i) => 
        {
          // console.log(tag);
          where += '\'' + tag + '\'' + '=ANY(tags) ';
          // if i is not the last index, append an or
          if (i < item.tags.length - 1){
            where += ' OR ';
          }
        });
        // append the conditions to the select query
        // SELECT * FROM < user1_spins > WHERE <tag>=ANY(tags)
        // query += where;
      }
      if (where.length > 0)
      {
        query += where;
      }

      // if last item in list do not append union
      if (index < followed.length - 1)
      {
        query += ' UNION ALL \n';
      }
    };


    // final string:
    // SELECT * FROM <user1_spins> WHERE tags =ANY(tags) <tags>
    // UNION ALL
    // SELECT * FROM <user2_spins> WHERE tags =ANY(tags) <tags>
    // UNION ALL
    // ...
    // ORDER BY date DESC;
    query += ' ORDER BY date DESC';

    // console.log(query);
    res = await client.query(query);
    posts.regularposts = res.rows;
    // console.log(posts);
    // console.log(newposts);
    query = '';
    if (newposts.length > 0)
    {
      for (var i = 0; i < newposts.length; i++)
      {
        var post = newposts[i];
        query += baseQuery + ` ${userSpinTableName(post.username)}
        WHERE id = ${post.postid}`;

        // if last item in list do not append union
        if (i < newposts.length - 1) {
          query += ' UNION ALL';
        }
      }
      query += ' ORDER BY date DESC';
      // console.log('newtagposts query =', query);
      var newposts = await client.query(query);
      // console.log('newposts =', newposts.rows);
      posts.newtagposts = newposts.rows;
    }
  }
  catch (e) {
    console.log('Error encounterd in db.getSpins:', e);
  }
  finally
  {
    client.release();
  }
  return posts;
};

// Adds the users spin into their spin table
// @param user = user who created the spin
// @param spin = spin to be added into the user's spin table
// @return spin id if success, false if failure
async function addSpin(username, spin) {
  var rows = [];
  var query;
  var client = await pool.connect();
  try {

    var tablename = userSpinTableName(username);
    await client.query('BEGIN');
    var newtags = [];
    // get the tags that the user currently posts about.
    var query = `SELECT tags_associated FROM ${USER_TABLE} WHERE username=$1`
    var args = [username];
    var res = await client.query(query, args);

    var tags_associated = res.rows[0].tags_associated;
    // adds the tags in tags_associated which wasn't in it before
    // finds and adds the new tags in newtags
    for (var i = 0; i < spin.tags.length; i++) {
      if (!tags_associated.includes(spin.tags[i])) {
        tags_associated.push(spin.tags[i]);
        newtags.push(spin.tags[i]);
      }
    }

    var args = [
      spin.content,
      unique(spin.tags),
      spin.edited,
      spin.likes,
      spin.quotes,
      spin.is_quote,
      JSON.stringify(spin.quote_origin),
      spin.like_list,
      username
    ];


    query = `INSERT INTO ${tablename}
      (content, tags, date, edited, likes, quotes, is_quote, quote_origin, like_list, username)
      VALUES ($1, $2::VARCHAR(19)[], NOW(), $3, $4, $5, $6, $7::JSON, $8::text[], $9::VARCHAR(15))
      RETURNING id`
    ;

    var res = await client.query(query, args);
    rows = res.rows;

    var postid = res.rows[0].id;
  
    // if there are any new tags, then add this post's id to the new post column
    if (newtags.length > 0) {
      args = [
        tags_associated,
        postid,
        username,
      ];
      // add the post to the new tag posts column and set a timer function
      query = `UPDATE ${USER_TABLE} SET tags_associated = $1, new_tag_posts=$2
                WHERE username = $3 RETURNING username, new_tag_posts`;
      res = await client.query(query, args);
      console.log(res.rows)
      // trigger a function to delete the post id from the new post column after
      // NEW_POST_TIMEOUT amount of time, 5 minutes for dev environment, 24 hours for
      // actual
      setTimeout(() => { clearNewPostColumn(username); }, NEW_POST_TIMEOUT);
    }

    await client.query('COMMIT');

  }
  catch(e) {
    await client.query('ROLLBACK');
    console.log(`An error occurred in db.addSpin: ${ e }`);
    return false;
  }
  finally {
    client.release();
  }
  return (rows.length === 0 ? false : rows[0].id);
};

// Allows user to edit the content and tags of a spin
async function updateSpin(username, spin_edit) {
  var rows = [];
  var client = await pool.connect();
  try {

    var tablename = userSpinTableName(username);
    await client.query('BEGIN');

    var args = [
      spin_edit.content,
      unique(spin_edit.tags),
      spin_edit.id
    ];

    var query = `UPDATE ${tablename} 
      SET content=$1, tags=$2, date=NOW(), edited=true
      WHERE id = $3 RETURNING username`
    ;

    var res = await client.query(query, args);
    
    var query = `SELECT tags_associated
      FROM ${USER_TABLE} 
      WHERE username = $1`
    ;

    var res = await client.query(query, [username]);

    rows = res.rows;

    var tags_associated = res.rows[0].tags_associated;
    var tags = tags_associated.concat(spin_edit.tags);
    tags = unique(tags)

    args = [
      tags,
      username
    ];

    var query = `UPDATE ${USER_TABLE} 
      SET tags_associated=$1
      WHERE username = $2 RETURNING username`
    ;

    var res = await client.query(query, args);
    rows = res.rows;
    await client.query('COMMIT');

  }
  catch(e) {
    await client.query('ROLLBACK');
    console.log(`An error occurred in db.updateSpin: ${ e }`);
  }
  finally {
    client.release();
  }
  return (rows.length === 0 ? false : rows[0].username);
}

// Deletes a spin provided that it exists
async function deleteSpin(username, spin_id) {
  var rows = [];
  var client = await pool.connect();
  try {

    var tablename = userSpinTableName(username);
    await client.query('BEGIN');

    var query =
      `DELETE FROM ${tablename} WHERE id=$1 RETURNING id, username`
    ;

    var res = await client.query(query, [spin_id]);
    rows = res.rows;
    await client.query('COMMIT');

  }
  catch(e) {
    await client.query('ROLLBACK');
    console.log(`An error occurred in db.deleteSpin: ${ e }`);
  }
  finally {
    client.release();
  }
  return (rows.length === 0 ? false : rows[0]);
}

// adds the userToFollow,tags pair into the following list of user
// @param username: username of the user will follow
// @param tofollow: username of user to add in following
// @param tags: tag list to add with tofollow in following list
// @return username of user on success or false on failure
async function followTopicUserPair(username, tofollow, tags) {
  var client = await pool.connect();
  var rows = [];

  try{

    await client.query('BEGIN');

    var args = [username];
    var changedInfo = false;

    // gets the users following list
    var query = `SELECT following FROM ${USER_TABLE} WHERE username = $1`;

    var res = await client.query(query,args);
    rows = res.rows;
    console.log(rows);

    var following = rows[0].following;

    var tofollowIndex = -1;
    for (var i = 0; i < following.users.length; i++) {
      if (following.users[i].username === tofollow) {
        tofollowIndex = i;
        break;
      }
    }

    // if not exists add new user
    if (tofollowIndex === -1) {
      var follow = {'username': tofollow, 'tags': tags};
      following.users.push(follow);
      changedInfo = true;
      // console.log("HERE 1");
    }

    // if its all tags
    else if (tags.length === 0) {
      if (following.users[tofollowIndex].tags.length === 0) {
        changedInfo = true;
      }
      else {
        following.users[tofollowIndex].tags = tags;
      }
    }

    // if exists add non-duplicate tags into tag list
    else {
      for (var i = 0; i < tags.length; i++) {
        if (!following.users[tofollowIndex].tags.includes(tags[i])) {
          following.users[tofollowIndex].tags.push(tags[i]);
          changedInfo = true;
        }
      }
    }

    args = [tofollow];

    query = `SELECT followers FROM ${USER_TABLE} WHERE username = $1`;

    res = await client.query(query,args);
    rows = res.rows;
    console.log(rows);


    var followers = rows[0].followers;

    if(!followers.includes(username)) {
      followers.push(username);
    }

    // update new following and new followers
    args = [tofollow, followers];

    query = `UPDATE ${USER_TABLE} SET followers = $2 WHERE username = $1 RETURNING username`;

    res = await client.query(query, args);

    args = [username, following];

    query = `UPDATE ${USER_TABLE} SET following = $2 WHERE username = $1 RETURNING username`;

    res = await client.query(query, args);

    await client.query('COMMIT');
    rows = res.rows;

    if (!changedInfo) {
      return "Error: nothing changed";
    }
  }
  catch (e) {
    await client.query('ROLLBACK');
    console.log(`An error occurred in db.followTopicUserPair: ${ e }`);
    // return e;
    return false;
  }
  finally {
    client.release();
  }
  console.log('returning from db.followuser', rows);
  return (rows.length === 0 ? false : rows[0].username);
};


// unfollows a topic user pair
// @param unfollowingUser: user who unfollows
// @param unfollowedUser: user who is being unfollowed
// @param tags: the tags of the unfollowedUser that are being unfollowed
// @return: true if both following and followers have been correctly updated,
//          false otherwise
async function unfollowTopicUserPair(unfollowingUser, unfollowedUser, tags) {

  var rows = [];
  var client = await pool.connect();
  try{
    // begin database transaction
    await client.query('BEGIN');

    var args = [unfollowingUser];
    var query = `SELECT following FROM ${USER_TABLE} WHERE username = $1`;

    var res = await client.query(query,args);
    rows = res.rows;
    var following = rows[0].following;
    var changedInfo = false;

    args = [unfollowedUser];
    query = `SELECT followers FROM ${USER_TABLE} WHERE username = $1`;

    res = await client.query(query,args);
    var followers = res.rows[0].followers;

    // if followed user found, delete the tags
    var followingIndex = -1;
    for (var i = 0; i < following.users.length; i++) {
      if (following.users[i].username === unfollowedUser) {
        followingIndex = i;
        break;
      }
    }

    var empty = false;
    if (followingIndex > -1)
    {
      // if tags is empty, it means that delete all tags
      if (tags.length === 0) {
        following.users.splice(followingIndex, 1);
        empty = true;
        changedInfo = true;

      }
      if (!empty) {
        for (var i = 0; i < tags.length; i++) {
          var index = following.users[followingIndex].tags.indexOf(tags[i]);
          if (index > -1) {
            following.users[followingIndex].tags.splice(index, 1);
            changedInfo = true;
          }
        }
        // if the removing tags makes it empty
        if (following.users[followingIndex].tags.length === 0) {
          following.users.splice(followingIndex, 1);
          empty = true;
        }
      }
    }

    // delete the followingUsername from list
    var unfollowingUserIndex = followers.indexOf(unfollowingUser);
    if (unfollowingUserIndex > -1 && empty) {
      followers.splice(unfollowingUserIndex, 1);
    }

    // send the new list of tags to database
    query = `UPDATE ${USER_TABLE} SET following = $2 WHERE username = $1 RETURNING username`;

    args = [unfollowingUser, following]

    var res = await client.query(query, args);

    query = `UPDATE ${USER_TABLE} SET followers = $2 WHERE username = $1 RETURNING username`;

    args = [unfollowedUser, followers];

    res = await client.query(query,args);

    if (!changedInfo) {
      return "Error: nothing changed";
    }

    // end the database transaction
    await client.query('COMMIT');
    rows = res.rows;
  }
  catch (e) {
    await client.query('ROLLBACK');
    console.log(`An error occurred in db.unfollowTopicUserPair: ${ e }`);
    return false;
  }
  finally {
    client.release();
  }

  return (rows.length === 0 ? false : rows[0].username);
};

// funtion increments like number of the spin by 1
// check that user_liker hasn't already liked the spin
// check that user_liker is added to spin's like_list
// @param user_liker: username of user which is liking the spin
// @param user_poster: username of user which is recieveing the like on his spin
// @param spin: spin which is being liked
// @return the spin which was liked on success and false on failure
async function likeSpin(user_liker, user_poster, spin) {
  var rows = [];
  console.log(user_liker, user_poster, spin);
  var client = await pool.connect();
  try {

    var tablename = userSpinTableName(user_poster);

    await client.query('BEGIN');

    var args = [spin];
    var query = `SELECT like_list FROM ${tablename} WHERE id = $1`;

    var res = await client.query(query, args);
    var like_list = res.rows[0].like_list;
    // console.log(like_list);

    // check that the user has not already liked the spin
    if (like_list.indexOf(user_liker) > -1) {
      console.log(user_liker + " has already liked the spin")
      await client.query('ROLLBACK');
      return false;
    }
    else {

      like_list.push(user_liker);
      var likes = like_list.length;
      args = [like_list, likes, spin];
      query = `UPDATE ${tablename} SET like_list = $1, likes = $2 WHERE id = $3 RETURNING *`;

      res = await client.query(query, args);

      rows = res.rows;
      // console.log(rows);
      await client.query('COMMIT');
    }
  } catch(e) {
    await client.query('ROLLBACK');
    console.log(`An error occurred in db.likespin: ${ e }`);
  }
  finally {
    client.release();
  }
  return (rows.length === 0 ? false : rows[0]);
};

// funtion decrements like number of the spin by 1
// check that user_liker has already liked the spin
// check that user_liker is removed from the spin's like_list
// @param user_liker: username of user which is unliking the spin
// @param user_poster: username of user which is poster of spin
// @param spin: spin which is being unliked
// @return the spin which was unliked on success and false on failure
async function unlikeSpin(user_liker, user_poster, spin) {
  var rows = [];
  var client = await pool.connect();
  try {

    var tablename = userSpinTableName(user_poster);
    await client.query('BEGIN');

    var args = [spin];
    var query = `SELECT like_list FROM ${tablename}
    WHERE id = $1`;

    var res = await client.query(query, args);
    // get the like list from the response object
    var like_list = res.rows[0].like_list;

    var index = like_list.indexOf(user_liker);
    // if the user is found in the like list then we remove the name
    // and write to the database
    console.log(index);
    if (index === -1) {
      console.log(user_liker + " has not liked the spin")
      await client.query("ROLLBACK");
      return false;
    }
    while (index > -1) {

      like_list.splice(index, 1);
      var likes = like_list.length;

      args = [like_list, likes, spin];
      query = `UPDATE ${tablename} SET like_list = $1, 
      likes = $2
      WHERE id = $3 RETURNING *`;

      res = await client.query(query, args);

      rows = res.rows;

      
      index = like_list.indexOf(user_liker);
    }
    await client.query('COMMIT');
  } catch(e) {
    await client.query('ROLLBACK');
    console.log(`An error occurred in db.unlikeSpin: ${ e }`);
  }
  finally {
    client.release();
  }
  return (rows.length === 0 ? false : rows[0]);
};


// error handler
pool.on('error', (err, client) => {
  console.error('An unknown database error occurred: ', err);
});


// @brief: Function to perform a lookup of a given user.
// @return: False if the user is not found,
async function searchForUser(userdata)
{
  var query = `SELECT username, profile_pic, tags_associated
   FROM ${USER_TABLE} WHERE username ~* $1 OR name ~* $1`;
  var results = [];
  try
  {
    results = await pool.query(query, ['.*' + userdata + '.*']);
    // console.log('users matching given criteria =', results.rows);
    return (results.rows.length > 0 ? results.rows : false);
  }
  catch (e)
  {
    console.log("Error encountered in db.searchForUser: ", e);
    return false;
  }
}

async function getSingleSpin(username, spinid)
{
  var spintable = userSpinTableName(username);
  var client = await pool.connect();
  var query = `SELECT * FROM ${spintable} where id = $1`;
  try 
  {
    var spin = {
      content: "-deleted-",
      id: null,
      username: '-deleted-',
      date: '-deleted-',
      likes: 0,
    }
    var exists = await client.query(`SELECT username from ${USER_TABLE} WHERE username = $1`, [username]);
    if (exists.rows.length === 0)
    {
      return spin;
    }
    var res = await client.query(query, [spinid]);

    if (res.rows.length > 0)
    {
      spin = res.rows[0];
    }
    return spin;;
  }
  catch (e)
  {
    console.log("Error encountered in db.getSingleSpin: ", e);
    return false;
  }
  finally 
  {
    client.release();
  }

}

module.exports = {
  getSpins,
  addSpin,
  followTopicUserPair,
  unfollowTopicUserPair,
  likeSpin,
  unlikeSpin,
  createUser,
  userExists,
  deleteUser,
  updateLoginTime,
  updateUser,
  updateSpin,
  deleteSpin,
  searchForUser,
  getSingleSpin,
  bootClearNewPosts,

};
