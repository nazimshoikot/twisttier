
# Profile Interface

## Searching for a user's profile TODO
__NOTE__ This functionality is not yet implemented. This is a preliminary specification only.
* __NOTE__ This functionality can be performed while a user is not logged in, and should be displayed on the main page, timeline, and all subsequent pages.

1. Client will `POST /api/search/:user` where `user` is a url parameter of the search string i.e. `?user=<arbitrary username or arbitrary name>`
2. Server will check that `user` is not empty.
    * If the field is empty, server will reply with `406` and header `error: query cannot be empty` will be returned.
2. Server will perform a lookup, returning all results in the form of a JSON where the `username` or `name` fields are like the value provided by `:user` as given by the below example response:

    * Client Request: `POST /api/search/s`
    * Response:
        ```
        [
          {
            username: 'seriously1',
            profile_pic: 'profileImages/1571946143009_IMG_20180804_121544677_copy.jpg',
            tags_associated: [],
            bio: ""
          },
          {
            username: 'sidv',
            profile_pic: 'profileImages\\1572393972370_pic.jpg',
            tags_associated: [],
            bio: ""
          },
        ]
        ```
3. If the user is not found, server will respond with `404` and set header `error: no users found matching that search parameter`.
4. Client will be responsible for creating and displaying live links to the users' profiles which the server returns.

## Querying User Login Status
* This is an endpoint strictly for querying whether a user is logged in.
Client will `POST /api/login_status`
Server will return the following:
    * __User is logged in:__ A cookie `username=<username>` will be set, as well as a response header `loggedIn: true`
    * __User is not logged in:__ Server will send response header `loggedIn: false`

## Creating a User

* Front end will send the following information via POST in the following format:

```
body: {
  email: <email@email.com>
  password: <password as plain text (minimum 8 characters)>
  name: <user's name (not to exceed 25 characters, but > 1 character)>
  bio: <user's bio (not to exceed 150 characters)>
  username: <username (not to exceed 15 characters)>
}
```
* Additionally, a profile image will be sent via `multipart/form-data`. The fieldname must be `profileImage=<img src>` where `<img src>` is the file from the upload field.

### Server response

* **Successful creation:** A json `userdata` will be sent with the user's nonsensitive profile information returned from the creation, a header `username` will be set (because i am lazy and don't want to rewrite half of the implementation of server side stuff.), and the following cookies will be set:
```
userdata: {
  username: <username>,
  last_login: <last_login>,
  profile_pic_path: <filepath on server>
}
```
```
cookies: {
  uid : <some arbitary hash value>
  username: <username>
}
```


* **Creation Failed due to user existing:** a header 'error' will be set and 406 will be returned ex
  error: 'user exists'

* **Creation Failed due to invalid data input:** a header 'error' will be set with the invalid input and status 406 will be returned

## Logging out

* Front end will `GET /logout`
* This will delete the user session and browser cookies, and will redirect to the root page

## Logging In

1. Client will `GET /login`
2. Server will verify that user is not logged in already
    * If user is logged in already, redirect to timeline
3. User will input information into login fields
4. Client will send username or email and password in the following format:
`POST /login`
```
body: {
  [username: <username>] or [email: <email@email.com>]
  password: <password>
}
```
5. Server will compare input and return
* __Under error conditions server will set status "401" and send "Unauthorized"
  * __If username is invalid:__ server will set header 'error' with message 'Username invalid
  * __If password is invalid:__ server will set header 'error' with message 'Incorrect Password'
  * __If, for whatever reason, the login time could not be updated:__ server will set header 'error' with message 'Login time could not be updated'

* __Successful login:__ a cookie `loggedIn` will be set true and `uid` cookie will be set with the hash of the user's username, and a JSON with the following parameters will be returned:
```
userdata : {
    username: <username>,
    profile_pic: <profile_pic filepath>
    last_login: <last_login>,
  };
```

* __Successful login:__ a cookie `loggedIn` will be set true and `uid` cookie will be set with the hash of the user's username, and a header `username: <username>` will be set.

## Getting a user's profile

1. Client will `POST /api/users/` with the username as a URL parameter ex `username=steve`
    * If an error occurs, an 'error' header will be set and 406 will be returned
3. Server will reply with JSON of user's information
 __NOTE:__ Profile image will be returned via a serverside filepath. Client will be responsible for `GET`ting this file accordingly.


## Updating a profile

1. Client will `POST /api/update/:username` with the username as a URL parameter ex `username=steve` and the following fields in the body of the html request:
```
body: {
  [password: <password>] // ONLY IF UPDATING PASSWORD
  bio: <bio (not to exceed 150 characters)>
  name: <name (not to exceed 25 characters)>
  interests: <current interests plus any new ones (interest names not to exceed 19 characters)>
  accessibility_features: <any accessibility features that front end will decide the names and values of>
  //TODO PROFILE PIC
}
```
- Additionally, a profile picture can be uploaded via `multipart/form-data`, and the fieldname must be `profileImage=<img src>`. Please see "Creating a User"

2. Server will check that user is logged in
3. Assuming user is logged in, server will respond in the following ways:
  * __Errors:__ If an error occurs, header 'error' will be set with some arbitrary error message
  * __Success:__ If the updating is successful, header 'username' will be set with the username of the person updated, and a JSON of the following user information will be returned:
  ```
    userdata: {
      username: <username>,
      last_login: <last_login>,
      profile_pic: <serverside profile picture filepath>
    }
  ```

## Deleting an account

1. Client will `POST /api/delete/` with the following parameters in the body:
```
body: {
  username: <username>
  email: <email>
  password: <password>
}
```
  __NOTE: All 3 fields are required.__
2. Client will prompt user for their password, and store this in the body parameters.
3. Server will validate password prior to attempting deletion
* If user is not logged in, Server will redirect to home page
* If the provided password is incorrect, server will set `error` header with message `deletion failed: bad password` and 406 will be returned.
* if there was a problem with deletion, header 'error' will be set with message 'deletion failed' and 406 will be returned
3. Server will delete client cookie and local session and redirect to `/`

---

# Follow Interface



## New Tags Posted

This is less of a communication specification and more of a procedural specification for how this functionality will work.
The rough outline for this process is as follows:

1. A user will create a new post with a tag which they are previously unassociated with (a new column must be added to the database to support this).
2. The `addSpin` functionality will check the tags of this post and see if they already exist.
3. If the post is not in the tags_associated list, the post ID will be placed into a `new_tag_posts` column which will expire in 24 hours. The `getSpins / getTimeline` functions will query this column and factor it into the returned object.
4. When the `getSpins / getTimeline` functions find a post in this column, they will populate an additional field in the response json, `newtagposts`. Please see ["Getting a User's Timeline"](#getting-a-users-timeline) for a description of the response object.
5. The client should then show a dialog prompting if the user would like to follow those tags, and then form a correct follow request.


## Following/Unfollowing A User [: Topic]
1. Client will `POST /api/updateFollowing` where params are the following body Parameters:
```
body: {
  toFollow: <username of the user to follow or unfollow>,
  tags: [list of tags to follow],
  follower: <username of user who is following>,
  action: <"follow" or "unfollow">
}
Note: When a user is to be unfollowed completely, the front end will send all
the tags of the user and the backend will use the same unfollow function
to remove all tags.
```
2. Server will verify that user is logged in, that both accounts exist, and the following circumstances:
* __Following Errors:__
    * __`toFollow` does not exist:__ header `error: <toFollow> does not exist` will be set
    * __Generic follow error:__ header `error: cannot follow <toFollow>`
* __Unfollowing Errors:__
    * __`toFollow` does not exist:__ header `error: <toFollow> does not exist` will be set
    * __Generic unfollow error:__ header `error: cannot unfollow <toFollow>`
* __Generic Errors:__
    * __Invalid action:__ if `action` is neither `follow` or `unfollow`, header `error: invalid action` will be set.
3. Server will return the following information upon successful following / unfollowing:
* ```
  params: {
    action: <action performed (either 'follow' or 'unfollow')>,
    follower: <username of the person following or unfollowing>,
    toFollow: <username of the person being followed or unfollowed>,
    tags: <tags which were followed or unfollowed>
  }
  ```
4. Server will reply with `418: I'm a teapot` if errors are detected.

---
# Spins Interface

## Getting a single spin from a user
1. Client will `POST /api/spin/username` with the following in the `POST body`:
    ```
    body : {
      spinID: <spin id here>
    }
    ```
2. Server will query the database for this user and the corresponding post's ID
  * Server will set header `error: unable to get spin <spinID> from <username>` if an error occurs
  * Under error conditions, server will send response `404: Not Found`
  * Server will respond with a single spin JSON upon success.

## Getting a single user's spins
 1. Client will `POST /api/posts/` with the username as a URL parameter ex `username=steve`
    * if the user is not found an 'error' header will be set with message 'user not found' and 404 will be returned
    * if there are no spins from the user header 'alert' will be set with message 'no spins found :('
 2. Server will respond with JSON of all posts made by the user in chronological order

## Getting a user's timeline

1. Client will `POST /api/timeline/` with the username as a URL parameter ex `username=steve`
    * if the user is not found an 'error' header will be set with message 'user not found' and 404 will be returned
    * if there are no spins from the user or any of the users they follow header 'alert' will be set with message 'no spins found :('

2. Server will return JSON of all spins in chronological order
__NOTE:__ When getting th elogged in individual's timeline, if there are posts made by the people `<logged in>` is following which contains tags that the poster did not posts about when `<logged in>` first followed them, the response object will look like the below. Otherwise `newtagposts` will be empty or left undefined, and `regularposts` will remain populated.
```
{
  newtagposts: [
    {<post 0 json>},
    {<post 1 json>}
    ...
  ],
  regularposts: [
    {regular post 0},
    {regular post 1},
    ...
  ]
}
```

## Liking / Unliking a spin

1. Client will `POST /api/spins/esteem` with the following parameters as an `esteem` object as a body parameter request:
```
body:
{
  esteem: {
    postAuthor: <author's username>,
    action: <'like' or 'unlike'>,
    liker: <username of the person liking the post>
    spinId: <ID of the spin to be liked / unliked>
  }
}
```

2. Server will validate that `liker` is logged in and all that stuff
3. Server will proceed to validate like status on the post:
* If the user already likes the post and tries to like again, server will set header `error` with message `unable to like post`.
* If the user tries to unlike a post and does not currently like it, server will set header `error` with message `unable to unlike post`
* If liking / unliking is successful, server will return the spin's updated information
3. Under error conditions, error headers will be set and server will respond with status `400: bad request`

## Adding a Spin


__Note__ This functionality requires integration testing with client
__Note__ Please refer to [this section](#new-tags-posted) for information on how the updates work for when a user makes a post about a previously unfollowed tag
1. Client will `POST /api/add_spin/<username>` with `username` as a URL parameter with the following parameters in the body:
  ```
  body: {
    spinBody: [some arbitary text here. <= 90 characters in length],
    tags: [list of tags i.e. ['tag1', 'tag2']],
    is_quote: [boolean. True if quoted, false if not],
    quote_origin: {
      username: <username of original author>,
      spinId: <id of original quote> //(front end will have a list of the post IDs available to it so this is possible)]
  };
  ```

2. Server will validate user session
3. server will attempt to add the post to the user's post table.
    * __Error:__ If the post was not able to be added, the server will set response header `error: unable to add spin` and will return status `418: I'm a teapot`
    * __Error:__ If the post does not fit within the length bounds of 1 <= length <= 90, server will set response header `error: ` with some arbitrary error message which I don't know and will return status `418: I'm a teapot`
    * __Error:__ If the post is a quote, but no quote origin is specified, server will set response header `error: no quote origin specified` and will return status `418: I'm a teapot`
    * __Success:__ If the post was successfully added, the server will set response header `spinId: [id]` and will send the index file.

## Editing a Spin
__NOTE:__ This is not Chris writing this so I hope you won't get an aneurysm while reading this.
__NOTE:__ When editing a spin is successful: edited will become true and the date of the spin will be updated.

1. Client will `POST /api/edit_spin/<username>` with `username` as a URL parameter with the following parameters in the body:
 ```
  body: {
    spinBody: [some arbitary text here. <= 90 characters in length],
    tags: [list of tags i.e. ['tag1', 'tag2']],
    spinID: id of the spin to edit
  };
  ```
2. Server will validate user session
3. server will attempt to add the post to the user's post table.
    * __Error:__ If the post was not able to be edited, the server will set response header `error: unable to update spin` and will return status `418: I'm a teapot`
    * __Error:__ If the post does not fit within the length bounds of 1 <= length <= 90, server will set response header `error: ` with some arbitrary error message and will return status `418: I'm a teapot`
    * __Success:__ If the post was successfully added, the server will set response header `spinId: [id]` and will send the index file.

##Deleting a Spin
<!-- __NOTE:__ This functionality has not been implemented yet. -->
__NOTE:__ Only 1 post may be deleted at a time. No plans to implement bulk removal.
1. Client will `POST /api/deleteSpin/<username>` with the `username` being a URL parameter and the `spinId` given in the body:
```
body: {
  spinId: <id>
}
```
2. Server will validate the user session.
3. If the user session is valid, the username will be gathered from the `clientSession.uid` cookie in the request object.
4. Server will attempt to remove the post from the user's post table
    * __Errors:__ If an error occurs, server will set response header `error: unable to delete spin` and return `418: I'm a teapot`
    * __Success:__ if the post is added successfully, server will set response header `spinId: [id]` and return the index.
