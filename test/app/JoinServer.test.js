const { newUnitTestServer, logger } = require('../handler/newUnitTestServer')
const request = require('supertest')
const { assert } = require('chai')
const sinon = require('sinon')
const app = require('../../src/app')

describe('POST /join', async () => {
	let srv

	beforeEach(() => {
		// JoinRequestService with mocked create()
		const joinRequestService = new app.JoinRequestService(
			logger,
			undefined, // onMemberJoin
		)
		joinRequestService.create = sinon.spy((_dataUnionClient, member, dataUnion, chain) => {
			return {
				member,
				dataUnion,
				chain,
			}
		})

		srv = newUnitTestServer({
			joinRequestService,
			signedRequestValidator: sinon.spy(async (req) => {
				req.validatedRequest = JSON.parse(req.body.request)
			}),
			customJoinRequestValidator: sinon.stub().resolves(true),
		})
	})

	afterEach(() => {
		srv = undefined
	})

	const happyTestCases = [
		{
			name: 'send join data union request',
			body: {
				address: '0x766760C748bcEcf5876a6469a6aed3C642CdA261',
				request: JSON.stringify({
					dataUnion: '0x81ed645D344cB2096aBA56B94d336E6dcF80f6C6',
					chain: 'polygon',
				}),
			},
		},
		{
			name: 'send join data union request without chain',
			body: {
				address: '0x766760C748bcEcf5876a6469a6aed3C642CdA261',
				request: JSON.stringify({
					dataUnion: '0x81ed645D344cB2096aBA56B94d336E6dcF80f6C6',
				}),
			},
		},
	]
	happyTestCases.forEach((tc) => {
		it(tc.name, async () => {
			const res = await request(srv.expressApp)
				.post(`/join`)
				.set('Content-Type', 'application/json')
				.send(tc.body)
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(200)

			assert.isTrue(srv.signedRequestValidator.calledOnce)
			assert.isTrue(srv.customJoinRequestValidator.calledOnce)
			assert.isTrue(srv.joinRequestService.create.calledOnce)

			const joinRequest = JSON.parse(tc.body.request)
			const expectedBody = {
				member: tc.body.address,
				dataUnion: joinRequest.dataUnion,
			}
			if (joinRequest.chain) {
				expectedBody.chain = joinRequest.chain
			}
			assert.deepEqual(res.body, expectedBody)
		})
	})

	const testCases = [
		{
			name: 'client sends invalid member address',
			body: {
				address: '0x00000',
				request: JSON.stringify({
					dataUnion: '0x81ed645D344cB2096aBA56B94d336E6dcF80f6C6',
					chain: 'polygon',
				}),
			},
			expectedErrorMessage: `Invalid member address: '0x00000'`,
		},
		{
			name: 'client sends invalid data union address',
			body: {
				address: '0x766760C748bcEcf5876a6469a6aed3C642CdA261',
				request: JSON.stringify({
					dataUnion: '0x01234',
					chain: 'polygon',
				}),
			},
			expectedErrorMessage: `Invalid Data Union contract address: '0x01234'`,
		},
		{
			name: 'client sends invalid chain name',
			body: {
				address: '0x766760C748bcEcf5876a6469a6aed3C642CdA261',
				request: JSON.stringify({
					dataUnion: '0x81ed645D344cB2096aBA56B94d336E6dcF80f6C6',
					chain: 'foobar',
				}),
			},
			expectedErrorMessage: `Invalid chain name: 'foobar'`,
		},
	]
	testCases.forEach((tc) => {
		it(tc.name, async () => {
			const res = await request(srv.expressApp)
				.post(`/join`)
				.set('Content-Type', 'application/json')
				.send(tc.body)
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(400)

			assert.equal(res.body.error.message, tc.expectedErrorMessage)
			assert.isFalse(srv.customJoinRequestValidator.called)
			assert.isFalse(srv.joinRequestService.create.called)
		})
	})

	it('fails the join request if the custom validator rejects', async () => {
		srv.customJoinRequestValidator = sinon.stub().rejects()

		await request(srv.expressApp)
			.post(`/join`)
			.set('Content-Type', 'application/json')
			.send(happyTestCases[0].body)
			.expect('Content-Type', 'application/json; charset=utf-8')
			.expect(400)
	})

	it('adds customRoutes upon constructions', () => {
		const customRoutes = sinon.stub()
		srv = newUnitTestServer({
			customRoutes,
		})

		assert(customRoutes.calledOnceWithExactly(srv.expressApp))
	})
})
