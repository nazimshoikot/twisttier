## Outline
This document is intended to outline a set of steps for verifying system functionality, and is really just a way for me to fully think everything through.

##Steps

__ON A DESKTOP IN GOOGLE CHROME USING HEROKU__
 #### 1. Create a user and verify that the user is taken to their timeline.
  * Ensure the following:
        * Profile picture is displayed properly and is not oversized
        * Bio is displayed properly and is scaled well
    
#### 2. Proceed to the user profile page (the page which shows the user's information)
  * Ensure that profile picture, email, and all other information shows
    up correctly.
#### 3. Attempt to change user information. 
  1. Change only the bio and interests. Check for correct response.
  2. Change only profile picture. Check for correct updating and response
  3. Change password. Log out and attempt to login with new password. Ensure this works.
  4. Change all fields at once. Repeat logout and login.
#### 4. Attempt to create posts.
  1. Make 2 posts with no tags. Check for correct client update and server response. 
  2. Make 2 posts with tags. Check for client update and server response. Also check database for updating the new_tag_posts column, and the tags_associated columns for the test user, accordingly. 
#### 5. Attempt to delete posts.
  1. Delete one of the posts with no tags. Verify client updates correctly and that the post is no longer in the database.
  2. Delete one of the posts with tags. Verify that client updates correctly and that the new_tag_posts column has been cleared of any post IDs.
#### 6. Attempt to follow.
  1. Attempt to follow 1 user, with no tags (every post) with several posts already created. Ensure that their posts now show up on the users timeline
  2. Attempt to follow 1 user with a subset of the tags they have posted about, and ensure that only the posts with those tags are displayed on the user's timeline.

####  7. Attempt to unfollow.
  1. Attempt to unfollw the user which all posts were followed for. Ensure that their posts no longer display on the user's timeline.
  2. Attempt to unfollow 1 of the tags for the user with tags which were followed. Ensure the posts associated with these tags no longer are displayed on the timeline.

#### 8. Attempt to delete a user.

  1. Create a new user.
  2. Proceed to update account page
  3. Attempt to delete account.
  4. Enter invalid password and ensure that the deletion is rejected.
  5. Enter the correct password and ensure that deletion is successful, that the user can no longer access private pages, and cannot login with the deleted account's username and password.
