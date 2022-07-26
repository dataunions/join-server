const { assert } = require('chai')
const domain = require('../../src/domain')

describe('Chain', () => {
	it('fromName() throws on undefined name', () => {
		try {
			domain.Chain.fromName(undefined)
			assert.fail('expecting error from Chain.fromName(undefined)')
		} catch (err) {
			assert.isTrue(true)
		}
	})
	it('fromName() throws on non string argument', () => {
		try {
			domain.Chain.fromName({})
			assert.fail('expecting error from Chain.fromName({})')
		} catch (err) {
			assert.isTrue(true)
		}
	})
	it('fromName() loads Chain instance from given string', () => {
		assert.equal(domain.Chain.fromName('Ethereum'), domain.Chain.Ethereum)
		assert.equal(domain.Chain.fromName('Polygon'), domain.Chain.Polygon)
	})
	it('fromName() returns undefined on unknown chain', () => {
		assert.equal(domain.Chain.fromName('FOOBAR'), undefined)
	})
})
