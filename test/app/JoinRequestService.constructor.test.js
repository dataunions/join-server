const chai = require('chai')
const { assert } = chai
chai.use(require('chai-as-promised'))
const app = require('../../src/app')
const logger = require('../rest/newUnitTestServer')

describe('JoinRequestService constructor', () => {
	beforeEach(() => {
	})

	afterEach(() => {
	})

	const testCases = [
		{
			name: 'logger is required',
			args: {
				logger: undefined,
				clients: new Map(),
				onMemberJoin: function(_member, _dataUnion, _chain) {},
			},
			expectedErrorMessage: 'Variable logger is required',
		},
		{
			name: 'clients is required',
			args: {
				logger: logger,
				clients: undefined,
				onMemberJoin: function(_member, _dataUnion, _chain) {},
			},
			expectedErrorMessage: 'Variable clients is required',
		},
		{
			name: 'onMemberJoin is required',
			args: {
				logger: logger,
				clients: new Map(),
				onMemberJoin: undefined,
			},
			expectedErrorMessage: 'Function onMemberJoin is required',
		},
	]
	const happyTestCases = [
		{
			name: 'creates new JoinRequestService',
			args: {
				logger: logger,
				clients: new Map(),
				onMemberJoin: function(_member, _dataUnion, _chain) {},
			},
		},
	]
	describe('constructor', () => {
		testCases.forEach((tc) => {
			it(tc.name, () => {
				try {
					new app.JoinRequestService(tc.args.logger, tc.args.clients, tc.args.onMemberJoin)
					assert.isTrue(true)
				} catch (err) {
					if (err.message !== tc.expectedErrorMessage) {
						assert.fail(`expecting error '${tc.expectedErrorMessage}', got: '${err.message}'`)
					}
				}
			})
		})
		happyTestCases.forEach((tc) => {
			it(tc.name, () => {
				try {
					new app.JoinRequestService(tc.args.logger, tc.args.clients, tc.args.onMemberJoin)
					assert.isTrue(true)
				} catch (err) {
					assert.fail(`unexpected error: ${err.message}`)
				}
			})
		})
	})
})
