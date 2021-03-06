'use strict'
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const RemoteProofs = require('../src/remote-proofs')

const { OBJECT, STRING, UNDEFINED,
        ARRAY, INTEGER, BOOL, FUNCTION } = require('../src/utils')
const { log, error } = require('../src/log')

const mockProofAPI = {
  // mock the proof instance to make this test focus only on
  // the validation bits
  verifyProof: (proof, callback) => {
    return callback(null, true)
  }
}

describe("remote-proofs test suite", function () {
  this.timeout(7000)
  const gistUrl =
        'https://gist.github.com/daviddahl/a818f62766893754a1d1f3c8b01c5cb6'
  const rp = new RemoteProofs(mockProofAPI)

  beforeEach(() => {});

  afterEach(() => {})

  let gistId
  let _proof

  context('remote-proof context', () => {

    it('gets gist id from URL', (done) => {
      expect(rp).to.exist()
      expect(typeof rp === OBJECT).to.be.true()

      gistId = rp.getGistIdFromUrl(gistUrl)

      expect(gistId.length).to.equal(32)

      done()
    })

    // TODO: add a mock object for the Gists library and make it
    // an argument to RemoteProofs so we don't actually hit the
    // network in this test

    it('gets gist from da internetz', (done) => {
      let gist
      rp.getGist(gistId).then((res) => {

        expect(typeof res).to.equal(OBJECT)
        let keys = Object.keys(res.files)
        expect(keys.length == 1)
        expect(keys[0]).to.equal('github-proof.json') // <-- arbitrary key name
        let proof = res.files[keys[0]].content

        expect(typeof proof).to.equal(STRING)

        let proofObj = JSON.parse(proof)

        expect(proofObj['handle']).to.equal('daviddahl')
        done()
      }).catch((ex) => {
        error(ex)
        expect(ex).to.not.exist()
      })

    })

    it('extract proof from gist', (done) => {
      gistId = rp.getGistIdFromUrl(gistUrl)
      rp.getGist(gistId).then((res) => {
        let gist = rp.extractProofFromGist(res)
        expect(gist).to.not.equal(null)
        expect(gist.handle).to.equal('daviddahl')
        expect(gist.proof.message.statement).to.
          equal('I am daviddahl on github.com')
        _proof = gist
        done()
      }).catch((ex) => {
        error(ex)
        expect(ex).to.not.exist()
      })
    })

    it('validate proof', (done) => {
      let valid = rp.validateProof(_proof, 'daviddahl', 'github.com')
      expect(valid).to.equal(true)

      done()
    })

    it('process multiple valid proofs end to end', (done) => {
      var items = [
        {
          url: 'https://gist.github.com/daviddahl/751f454e1083eb07e802da474c03072d',
          username:'autonomica',
          service: 'reddit.com'
        },
        {
          url: 'https://www.reddit.com/user/autonomica/comments/9ukr52/proof/',
          username:'autonomica',
          service: 'reddit.com'
        }
      ]

      rp.verifyMultipleRemoteProofs(items, (err, valid) => {
        setTimeout(() => {
          // TODO: setTimout should be removed with mock network access
          expect(err).to.equal(null)
          expect(valid[0].valid).to.equal(true)
          expect(valid[1].valid).to.equal(true)
          expect(valid[0].doc.handle).to.equal('daviddahl')
          done()

        }, 50)
      })
    })

    // TODO: test mix of invalid and valid gitst urls

  })
})
