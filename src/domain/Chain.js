class Chain {
	static Ethereum = Object.freeze(new Chain("ethereum"))
	static Polygon = Object.freeze(new Chain("polygon"))

	constructor(name) {
		if (name === undefined) {
			throw new Error('Chain name is required')
		}
		if (typeof name !== 'string') {
			throw new Error('Chain name must be a string')
		}
		this.name = name
	}

	toString() {
		return this.name
	}

	static fromName(name) /* Chain | undefined */{
		if (name === undefined) {
			return undefined
		}
		if (typeof name !== 'string') {
			return undefined
		}
		switch (name.toLowerCase()) {
		case Chain.Ethereum.toString():
			return Chain.Ethereum
		case Chain.Polygon.toString():
			return Chain.Polygon
		default:
			throw new Error(`Chain name is unknown: '${name}'`)
		}
	}
}

module.exports = {
	Chain,
}