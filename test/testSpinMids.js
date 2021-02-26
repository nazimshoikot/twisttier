const spins = require('../server/spinMiddlewares.js');
const assert = require('assert');
const httpMocks = require('node-mocks-http');



describe.skip('test spin middleware functions', async () => {
    
  describe.skip('#delete spin', async () => {
    it ("@spin exists", async () => {
      console.log('delete existing spin');
      var testSpinId = await create_test_spin();
      console.log("spinId:", testSpinId);
      const req = httpMocks.createRequest(
        {
          method: "POST",
          url: '/api/deleteSpin/f',
          params: { username: 'f' },
          body: {
            spinId: testSpinId
          }
        });

      const mockres = httpMocks.createResponse();
      await spins.removeSpin(req, mockres, () => {});

      const actualRes = mockres.getHeader('error');

      assert.deepStrictEqual(actualRes, undefined, 'expected undefined but got ' + String(actualRes));
      // post to router
    });
  });

  describe("#create spin", async () => {

    it("@quote == false: ", async () => {
      const req = httpMocks.createRequest(
        {
          method: "POST",
          url: '/api/add_spin/f',
          params: { username: 'doeJohn' },
          body: {
            spinBody: "god is gone :( ma boi died",
            tags: ['god', 'ma boi'],
            is_quote: false,
            quote_origin: undefined
          }
        });

      const mockres = httpMocks.createResponse();

      // post to router
      await spins.createSpin(req, mockres, () => {});
      const actualRes = mockres.getHeader('error');

      assert.deepStrictEqual(actualRes, undefined, 'expected undefined but got' + String(actualRes));
    });
    it("@quote == true, origin undefined: ", async () => {
      const req = httpMocks.createRequest(
        {
          method: "POST",
          url: '/api/add_spin/f',
          params: { username: 'f' },
          body: {
            spinBody: "yo screw you man",
            tags: ['wtf', 'kill me'],
            is_quote: true,
            quote_origin: undefined
          }
        });

      const mockres = httpMocks.createResponse();

      // post to router
      await spins.createSpin(req, mockres, () => { });
      const actualRes = mockres.getHeader('error');

      assert.notDeepStrictEqual(actualRes, undefined, 'expected to be defined but response was undefined.');

    });

    it("@quote == true, origin defined: ", async () => {
      const req = httpMocks.createRequest(
        {
          method: "POST",
          url: '/api/add_spin/f',
          params: { username: 'f' },
          body: {
            spinBody: "yo screw you man",
            tags: ['wtf', 'kill me'],
            is_quote: true,
            quote_origin: { username: 'bringMeDeath', id: 1}
          }
        });

      const mockres = httpMocks.createResponse();

      // post to router
      await spins.createSpin(req, mockres, () => { });
      const actualRes = mockres.getHeader('error');

      assert.deepStrictEqual(actualRes, undefined, 'expected undefined but was ' + String(actualRes));

    });

  });

  describe.skip('#like spin', async () => {
    it('@test like spin not in like list', async () => {
      console.log('@test like spin not in like list');
      const req = httpMocks.createRequest(
        {
          method: "POST",
          url: '/api/esteemSpin/params',
          params: { 
            esteem: {
              liker: 'doeJohn',
              postAuthor: 'f',
              action: 'like',
              spinId: 356
            }
           }
        });
      
      const mockres = httpMocks.createResponse();
      
      // post to router
      await spins.esteemSpin(req, mockres, () => {});
      const actualRes = mockres.getHeader('error');
      assert.deepStrictEqual(actualRes, undefined, 'expected to have no error but got ' + actualRes);
    });

    it('@test like spin in like list', async () => {
      console.log('@test like spin in like list');
     
    });
  });

  describe.skip("#unlike spin", async () => {
    it('@test unlike spin not in like list', async () => {
      console.log('@test unlike spin not in like list');

    });

    it('@test unlike spin in like list', async () => {
      console.log('@test unlike spin in like list');

    });
  });
});

async function create_test_spin()
{
  const req = httpMocks.createRequest(
    {
      method: "POST",
      url: '/api/add_spin/f',
      params: { username: 'f' },
      body: {
        spinBody: "yo screw you man",
        tags: ['wtf', 'kill me'],
        is_quote: false,
        quote_origin: undefined
      }
    });

  const mockres = httpMocks.createResponse();

  // post to router
  await spins.createSpin(req, mockres, () => {});
  const actualRes = mockres.getHeader('spinId');
  return actualRes;
}