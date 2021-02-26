const assert = require('assert');
const httpMocks = require('node-mocks-http');
const router = require('../server/accountFunctions');
const db = require('../server/dbFunctions');
const spins = require('../server/spinMiddlewares.js');



describe.skip("middleware / routing function tests", () => {
  describe("#createUser !exist", async () => { 
    it("should return a redirect to the upload profile image page", async () => {
        const req = httpMocks.createRequest(
        {
          method: "POST",
          url: '/create_user',
          body: {
            username: 'bringMeDeath',
            email: 'welcometohell@gmail.com',
            name: "Kurt",
            password: "password",
            bio: 'why am i the only one actually working?',
          }
        });

      const mockres = httpMocks.createResponse();
      // post to router
      await router.postCreateUser(req, mockres, () => {});
      const actualRes = mockres.getHeader('error');

      if (!actualRes){
        assert.notDeepStrictEqual(actualRes, 'user exists');
      }
      else{
        assert.notDeepStrictEqual(actualRes, false);
      }
      return true;
    });
  });

  describe("#delete account", async () => {

    before(async () => {
      console.log('creating test user for deletion of account testing.')
      const req = httpMocks.createRequest(
        {
          method: "POST",
          url: '/create_user',
          body: {
            username: 'endMyPain',
            email: 'welcometohell1@gmail.com',
            name: "Kurt",
            password: "password",
            bio: 'why am i the only one actually working?',
          }
        });
    
      const mockres = httpMocks.createResponse();
      // post to router
      await router.postCreateUser(req, mockres, () => {});
      if (mockres.getHeader('error')){
        assert.fail("IDK WTF happened here man, here is the error from the creation: " + mockres.getHeader('error'));
      }
    });

    it('@delete account bad pass', async () => {
      const req = httpMocks.createRequest(
        {
          method: "POST",
          url: '/delete',
          body: {
            username: 'endMyPain',
            email: 'welcometohell1@gmail.com',
            password: "ogarjfvvfphfpqu",
          }
        });
    
      const mockres = httpMocks.createResponse();
      await router.deleteAccount(req, mockres, () => {});
      var error = mockres.getHeader('error');

      assert.notDeepStrictEqual(error, undefined, 'expected error header to be defined but was ' + error);
    });

    it('@delete account good pass', async () => {
      const req = httpMocks.createRequest(
        {
          method: "POST",
          url: '/delete',
          body: {
            username: 'endMyPain',
            email: 'welcometohell1@gmail.com',
            password: "password",
          }
        });
    
      const mockres = httpMocks.createResponse();
      await router.deleteAccount(req, mockres, () => {});
      var error = mockres.getHeader('error');

      assert.deepStrictEqual(error, undefined, 'expected error header to be undefined but was ' + error);
    });
  });

  describe('#authorize', () => {
 
    it('@test authorize good pass', async () => {
      const req = httpMocks.createRequest(
        {
          method: 'POST',
          url: '/login',
          body: {
            username: 'bringMeDeath',
            password: 'password',
          }
        });

        const mockres = httpMocks.createResponse();

        await router.authorize(req, mockres, () => {});

        const actual = mockres._getHeaders();
        assert.notDeepStrictEqual(actual, undefined);
    });

    it('@test authorize bad pass', async () => {
      const req = httpMocks.createRequest(
        {
          method: 'POST',
          url: '/login',
          body: {
            username: 'bringMeDeath',
            password: 'bad pass',
          }
        });

      const mockres = httpMocks.createResponse();

      await router.authorize(req, mockres, () => {});

      const actual = mockres.getHeader('error');
      const expected = 'Incorrect Password' ;

      assert.deepStrictEqual(actual, expected);

    });

    it('@test authorize no user', async () => {
      const req = httpMocks.createRequest(
        {
          method: 'POST',
          url: '/login',
          body: {
            username: 'gfhjksdfghjhuif',
            password: 'password',
          }
        });

      const mockres = httpMocks.createResponse();

      await router.authorize(req, mockres, () => {});

      const actual = mockres.getHeader('error');
      const expected = 'Username invalid';
        // console.log("actual: ", actual);
        // console.log("expected: ", expected);
      assert.deepStrictEqual(actual, expected);
    });
  });

// TODO test for following multiple people with a different account
//     create an account for each test, then delete the account after the test is run
  describe('#getTimeline', () => {
    it('@getTimeline bringMeDeath ', async () => {
      const req = httpMocks.createRequest(
        {
          method: "POST",
          url: '/api/timeline/doeJohn',
          params: {
            username: 'doeJohn',
          }
      });

      const mockRes = httpMocks.createResponse();
      await router.getTimeline(req, mockRes, () => {});

      const actualRes = mockRes._getJSONData();

      if (mockRes.getHeader('error') != undefined){
        assert.fail();
      }

      // console.log(actualRes);

    });
  });

  describe("#updateProfileInfo", async () => { 
    it("user exists, returns user updated", async () => {
        const req = httpMocks.createRequest(
        {
          method: "POST",
          url: '/updateProfileInfo',
          body: {
            username: 'test',
            password: 'passwordsr4losers',
            bio: 'i hate my life', 
            name: 'test', 
            interests: [],
            accessibility_features: {},
            profile_pic: []
            
          }
        });

      const mockres = httpMocks.createResponse();
      
      // post to router
      await router.updateProfileInfo(req, mockres, () => {});
      const actualRes = mockres.getHeader('error');
        // console.log(actualRes);
      assert.deepStrictEqual(actualRes, undefined);
    });
    it("username does not exist, should return user not found", async () => {
      const req = httpMocks.createRequest(
      {
        method: "POST",
        url: '/updateProfileInfo',
        body: {
          username: 'this_sucks',
          password: 'i do not exist',
          bio: 'doesnotexist', 
          name: 'existingispain', 
          interests: [],
          accessibility_features: {},
          profile_pic: []
        }
      });
  
      const mockres = httpMocks.createResponse();
    
      // post to router
      await router.updateProfileInfo(req, mockres, () => {});
      // console.log(mockres);
      const actualRes = mockres.getHeader("error");
      // console.log("actual:", actualRes);
      assert.notDeepStrictEqual(actualRes, undefined);
    });
    // updateprofileInfo should return next() if fail not false, 
    // need a test for that
    it("username exists with password not given, should return user found", async () => {
      const req = httpMocks.createRequest(
      {
        method: "POST",
        url: '/updateProfileInfo',
        body: {
          username: 'doeJohn',
          bio: 'yellow', 
          name: 'Harvey', 
          interests: [],
          accessibility_features: {},
          profile_pic: []
        }
      });
  
      const mockres = httpMocks.createResponse();
    
      // post to router
      await router.updateProfileInfo(req, mockres, () => {});
      // console.log(mockres);
      const actualRes = mockres.getHeader("username");
      // console.log("actual:", actualRes);
      assert.notDeepStrictEqual(actualRes, undefined);
    });
  });

  describe('#getPosts', async () => {
    it('@test get posts doeJohn', async () => {
        const req = httpMocks.createRequest(
          {
            method: "POST",
            url: '/api/timeline/post',
            params: {
              username: 'doeJohn',
            }
        });
  
        const mockRes = httpMocks.createResponse();
        await router.getPosts(req, mockRes, () => {});
  
        const actualRes = mockRes._getJSONData();
  
        if (mockRes.getHeader('error') != undefined){
          assert.fail();
        }
    });
  });

  describe("#get info", async () => { 
    it("@username exists: ", async () => {
        const req = httpMocks.createRequest(
        {
          method: "POST",
          url: '/api/users/test',
          params: {
            username: "test",
          }
        });

      const mockres = httpMocks.createResponse();
      
      // post to router
      await router.getUserInfo(req, mockres, () => {});
      const actualRes = mockres.getHeader('error');
      if (actualRes != undefined){
        assert.notDeepStrictEqual(actualRes, undefined);
      }
    });
    
  });

  describe("#updateFollowing", async () => { 

    it("Follow: toFollow and follower exist - error should be undefined", async () => {
      const req = httpMocks.createRequest(
        {
          method: "POST",
          url: '/updateFollowing',
          body: {
            action : "follow",
            toFollow : "seriously",
            tags : ['newFollowTag'],
            follower : "sidv"  
          }
        });
    
      const mockres = httpMocks.createResponse();
      
      // post to router
      await router.updateFollowing(req, mockres, () => {});
      
      const actualRes = mockres.getHeader('error');
      // console.log(actualRes);
      
      assert.deepStrictEqual(actualRes, undefined);
    }); 

    it("Duplicate check through middleware - there should be an error", async () => {
      const req = httpMocks.createRequest(
        {
          method: "POST",
          url: '/updateFollowing',
          body: {
            action : "follow",
            toFollow : "seriously",
            tags : ['newFollowTag'],
            follower : "sidv"  
          }
        });
    
      const mockres = httpMocks.createResponse();
      
      // post to router
      await router.updateFollowing(req, mockres, () => {});
      
      const actualRes = mockres.getHeader('error');
      console.log(actualRes);
      
      assert.notEqual(actualRes, undefined);
    });

    it("Unfollowing: tags and toFollow exists - error should be undefined", async () => {
        const req = httpMocks.createRequest(
        {
          method: "POST",
          url: '/updateFollowing',
          body: {
            action : "unfollow",
            toFollow : "seriously",
            tags : ['newFollowTag'],
            follower : "sidv"  
          }
        });

      const mockres = httpMocks.createResponse();
      
      // post to router
      await router.updateFollowing(req, mockres, () => {});
      
      const actualRes = mockres.getHeader('error');
      // console.log(actualRes);
      
      assert.deepStrictEqual(actualRes, undefined);
    }); 

    it("Duplicate check for unfollowing through middleware - there should be an error", async () => {
      const req = httpMocks.createRequest(
      {
        method: "POST",
        url: '/updateFollowing',
        body: {
          action : "unfollow",
          toFollow : "seriously",
          tags : ['newFollowTag'],
          follower : "sidv"  
        }
      });

    const mockres = httpMocks.createResponse();
    
    // post to router
    await router.updateFollowing(req, mockres, () => {});
    
    const actualRes = mockres.getHeader('error');
    console.log(actualRes);
    
    assert.notEqual(actualRes, undefined);
  });

    
     
    
  });

  
  

});

async function create_test_user()
{
  

}