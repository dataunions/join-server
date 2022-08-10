const { newUnitTestServer } = require('../rest/newUnitTestServer')
const { unitTestLogger } = require('../rest/unitTestLogger')
const request = require('supertest')
const { assert } = require('chai')
const sinon = require('sinon')
const app = require('../../src/app')

describe('POST /join', async () => {
	let srv

	beforeEach(() => {
		// JoinRequestService with mocked create()
		const joinRequestService = new app.JoinRequestService(
			unitTestLogger,
			new Map(), // clients
			function(_member, _dataUnion, _chain) {}, // onMemberJoin
		)
		joinRequestService.create = sinon.spy((member, dataUnion, chain) => {
			return {
				member,
				dataUnion,
				chain,
			}
		})

		srv = newUnitTestServer({
			logger: unitTestLogger,
			joinRequestService,
			signedRequestValidator: sinon.spy(async (req) => {
				req.validatedRequest = JSON.parse(req.body.request)
			}),
			customJoinRequestValidator: sinon.stub().resolves(true),
		})
	})

	afterEach(() => {
		srv.close()
		srv = undefined
	})

	it('fails the join request if the custom validator rejects', async () => {
		srv.customJoinRequestValidator = sinon.stub().rejects()
		const expectedStatus = 400
		await request(srv.expressApp)
			.post(`/join`)
			.set('Content-Type', 'application/json')
			.send({
				address: '0x766760C748bcEcf5876a6469a6aed3C642CdA261',
				request: JSON.stringify({
					dataUnion: '0x81ed645D344cB2096aBA56B94d336E6dcF80f6C6',
					chain: 'polygon',
				}),
			})
			.expect((res) => (res.status != expectedStatus ? console.error(res.body) : true)) // print debug info if something went wrong
			.expect(expectedStatus)
			.expect('Content-Type', 'application/json; charset=utf-8')
	})

	it('adds customRoutes upon constructions', () => {
		const customRoutes = sinon.stub()
		srv = newUnitTestServer({
			customRoutes,
		})

		assert(customRoutes.calledOnceWithExactly(srv.expressApp))
	})
})
