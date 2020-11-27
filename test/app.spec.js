const supertest = require('supertest')
const app = require('../src/app')

describe('Inventory Endpoints', () => {
  describe('GET /api/inventory', () => {
    context('Given no inventory items', () => {
      it('Returns 200 and an empty array', () => {
        return supertest(app)
          .get('/api/inventory')
          .expect(200, [])
      })
    })
    context('Given inventory items', () => {
      const expectedItems = [{item: 1}, {item: 2}]
      it('Returns 200 and the inventory array', () => {

        return supertest(app)
          .get('/api/inventory')
          .expect(200, expectedItems)
      })
    })
    context('Given an xss attack item', () => {
      it('Returns the sanitized item', () => {

      })
    })

  })
  describe('POST /api/inventory', () => {
    it('')
  })

})