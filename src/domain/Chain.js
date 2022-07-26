class Chain {
	static Ethereum = new Chain("Ethereum")
	static Polygon = new Chain("Polygon")

	constructor(name) {
		this.name = name
	}

	toString() {
		return this.name
	}

	static fromName(name) {
		if (name === undefined) {
			throw new Error('Given chain name is undefined')
		}
		if (typeof name !== 'string') {
			throw new Error('Given chain name is not a String')
		}
		switch (name.toLowerCase()) {
		case Chain.Ethereum.toString().toLowerCase():
			return Chain.Ethereum
		case Chain.Polygon.toString().toLowerCase():
			return Chain.Polygon
		default:
			return undefined
		}
	}
}

module.exports = {
	Chain,
}