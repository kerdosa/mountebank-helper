const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiSubset = require('chai-subset');
chai.should();

chai.use(chaiAsPromised);
chai.use(chaiSubset);


// import the mountebank helper library
const mbHelper = require('../src/index');
const Imposter = mbHelper.Imposter;
const startMbServer = mbHelper.startMbServer;
const fetch = require('node-fetch');

describe('Posting to MounteBank', function () {
  before(function startUpMounteBank() {
    startMbServer(2525);
  });
  it('Should return a resolved promise on a good request', function () {
    const sampleResponse = {
      'uri' : '/pets/123',
      'verb' : 'PUT',
      'res' : {
        'statusCode': 200,
        'responseHeaders' : { 'Content-Type' : 'application/json' },
        'responseBody' : JSON.stringify({ 'somePetAttribute' : 'somePetValue' })
      }
    };
    const testImposter = new Imposter({ 'imposterPort' : 3000 });
    testImposter.addRoute(sampleResponse);
    return testImposter.postToMountebank().should.be.eventually.fulfilled.and.have.property('status').and.equal(201);
  });

  it('Should return a resolved promise with a correct response on a update request', function () {
    const testImposter = new Imposter({ 'imposterPort' : 3001 });
    const sampleResponse = {
      'uri' : '/pets/123',
      'verb' : 'PUT',
      'res' : {
        'statusCode': 200,
        'responseHeaders' : { 'Content-Type' : 'application/json' },
        'responseBody' : JSON.stringify({ 'somePetAttribute' : 'somePetValue' })
      }
    };
    const newBody =  JSON.stringify({ 'updatedAttribute' : 'newValue' });
    const pathToUpdate =  { 'uri' : '/pets/123', 'verb' : 'PUT' };

    testImposter.addRoute(sampleResponse);
    return testImposter.postToMountebank()
    .then(function () {
      return testImposter.updateResponseBody(newBody, pathToUpdate);
    })
    .then(function (body) {
      return JSON.parse(body);
    })
    .should.be.eventually.fulfilled.and.have.property('port').and.equal(3001);
  });

  it('Should return the correctly updated response body on an update', function () {
    const sampleRespnse = {
      'uri' : '/pets/123',
      'verb' : 'PUT',
      'res' : {
        'statusCode': 200,
        'responseHeaders' : { 'Content-Type' : 'application/json' },
        'responseBody' : JSON.stringify({ 'somePetAttribute' : 'somePetValue' })
      }
    };
    const testImposter = new Imposter({ 'imposterPort' : 3002 });
    testImposter.addRoute(sampleRespnse);
    return testImposter.postToMountebank()
    .then(function () {
      return testImposter.updateResponseBody(JSON.stringify({ 'updatedAttribute' : 'newValue' }), { 'uri' : '/pets/123', 'verb' : 'PUT' });
    })
    .then(function (body) {
      return JSON.parse(JSON.parse(body).stubs[0].responses[0].is.body);
    })
    .should.eventually.have.key('updatedAttribute');
  });

  describe('Complete Imposter Test', function () {
    it('The correct response is returned when hitting a route on which an imposter is listening on', function () {
      console.log('hello');
      const sampleRespnse = {
        'uri' : '/pets/123',
        'verb' : 'GET',
        'res' : {
          'statusCode': 200,
          'responseHeaders' : { 'Content-Type' : 'application/json' },
          'responseBody' : JSON.stringify({ 'somePetAttribute' : 'somePetValue' })
        }
      };
      const testImposter = new Imposter({ 'imposterPort' : 3009 });
      testImposter.addRoute(sampleRespnse);
      return testImposter.postToMountebank()
      .then(function () {
        console.log('hello from successful postToMountebank');
        return fetch('http://localhost:3009/pets/123')
        .then( response => {
          return response.text();
        })
        .then( body => {
          return body.should.equal(JSON.stringify({ 'somePetAttribute' : 'somePetValue' }));
        })
        .catch( error => {
          console.log('error: ');
          console.log(error);
        });
      })
      .catch( error => {
        console.log('error: ');
        console.log(error);
      });
    });
  });
});
