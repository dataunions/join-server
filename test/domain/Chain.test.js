const { assert } = require('chai')
const domain = require('../../src/domain')

describe('Chain', () => {
	it('throws on undefined value', () => {
		try {
			new domain.Chain(undefined)
			assert.fail('expecting error from new Chain(undefined)')
		} catch (err) {
			assert.isTrue(true)
		}
	})
	it('throws if given value is not a string', () => {
		try {
			new domain.Chain({})
			assert.fail('expecting error from new Chain({})')
		} catch (err) {
			assert.isTrue(true)
		}
	})
	it('fromName() returns undefined on undefined name', () => {
		assert.equal(domain.Chain.fromName(undefined), undefined)
	})
	it('fromName() returns undefined on non string argument', () => {
		assert.equal(domain.Chain.fromName({}), undefined)
	})
	it('fromName() loads Chain instance from given string', () => {
		assert.equal(domain.Chain.fromName('Ethereum'), domain.Chain.Ethereum)
		assert.equal(domain.Chain.fromName('ethereum'), domain.Chain.Ethereum)
		assert.equal(domain.Chain.fromName('Polygon'), domain.Chain.Polygon)
	})
	it('fromName() returns undefined on unknown chain', () => {
		try {
			domain.Chain.fromName('FOOBAR')
			assert.fail('expecting error from Chain.fromName(\'FOOBAR\')')
		} catch (err) {
			assert.isTrue(true)
		}
	})
})
