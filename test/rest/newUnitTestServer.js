const pino = require('pino')
const app = require('../../src/app')

const logger = pino({
	name: 'unit-test',
	level: 'trace',
	enabled: false,
})

function newUnitTestServer(conf) {
	const clients = new Map()
	const onMemberJoin = async (_member, _dataUnion, _chain) => {}
	return new app.JoinServer({
		privateKey: '52ada1a52c1224e7c5d7b17860cb622efb60eb4145e297a1b28b6fa06649be52',
		joinRequestService: new app.JoinRequestService(logger, clients, onMemberJoin),
		port: process.env.PORT,
		logger,
		...conf,
	})
}

module.exports = {
	newUnitTestServer,
	logger,
}
