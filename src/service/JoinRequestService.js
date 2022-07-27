class JoinRequestService {
	constructor(logger) {
		this.logger = logger
	}

	async create(dataUnionClient, member, dataUnion) {
		let du
		try {
			du = await dataUnionClient.getDataUnion(dataUnion.toString())
		} catch (err) {
			throw new DataUnionRetrievalError(`Error while retrieving data union ${dataUnion}: ${err.message}`)
		}
		
		try {
			await du.addMembers([member.toString()])
		} catch (err) {
			throw new DataUnionJoinError(`Error while adding member ${member} to data union ${dataUnion}: ${err.message}`)
		}

		return {
			member: member.toString(),
			dataUnion: dataUnion.toString(),
		}
	}
}

class DataUnionRetrievalError extends Error {}
class DataUnionJoinError extends Error {}

module.exports = {
	JoinRequestService,
	DataUnionRetrievalError,
	DataUnionJoinError,
}