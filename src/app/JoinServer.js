const process = require('process')
const express = require('express')
const http = require('http')
const pino = require('pino')

const { DataUnionClient } = require('@dataunions/client')
const config = require('@streamr/config')

const rest = require('../rest')
const domain = require('../domain')
const { JoinRequestService } = require('./JoinRequestService')

const signals = Object.freeze({
	'SIGINT': 2,
	'SIGTERM': 15,
})

class JoinServer {
	constructor({
		/**
		 * These options are primarily intended for end users
		 */

		// Hex-encoded private key for your joinPartAgent address
		privateKey,

		// HTTP port the server listens on
		port = 5555,

		// Logger (pino) level: one of 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent'.
		logLevel = 'info',

		// Used to validate custom fields in join requests. The default function does nothing.
		customJoinRequestValidator = async (/* address, joinRequest */) => {},

		// Used to add custom routes to the HTTP server. The default function does nothing.
		customRoutes = (/*expressApp*/) => {},

		// Gets called after a member is successfully joined to the Data Union smart contract. The default function does nothing.
		onMemberJoin = async (/* member, dataUnion, chain */) => {},

		/**
		 * These options are primarily intended for advanced use or passing in test mocks
		 */
		expressApp = express(),
		httpServer = undefined,  /* node http.Server */
		logger = pino({
			name: 'main',
			level: logLevel,
		}),
		signedRequestValidator = rest.SignedRequestValidator.validator,
		joinRequestService = undefined,
	} = {}) {

		this.expressApp = expressApp
		this.logger = logger
		this.signedRequestValidator = signedRequestValidator
		this.customJoinRequestValidator = customJoinRequestValidator
		if (!joinRequestService) {
			const clients = new Map()
			const chains = config.Chains.load()
			for (const chainName in chains) {
				for (const contractName in chains[chainName].contracts) {
					if (contractName === "DataUnionFactory") {
						clients.set(chainName, this.newDataUnionClient(chains[chainName], privateKey))
					}
				}
			}
			joinRequestService = new JoinRequestService(logger, clients, onMemberJoin)
		}
		this.joinRequestService = joinRequestService
		this.customRoutes = customRoutes

		if (!httpServer) {
			const httpServerOptions = {
				maxHeaderSize: 4096,
			}
			httpServer = http.createServer(httpServerOptions, expressApp)
		}
		this.httpServer = httpServer
		this.port = port

		// Listen for Linux Signals
		const invalidExitArg = 128
		Object.keys(signals).forEach((signal) => {
			process.on(signal, () => {
				this.httpServer.close(() => {
					this.close()
					this.logger.info(`HTTP server stopped by signal: ${signal}`)
					const exitCode = invalidExitArg + signals[signal]
					process.exit(exitCode)
				})
			})
		})

		this.routes()
	}

	close() {
		this.joinRequestService.close()
		Object.keys(signals).forEach((signal) => {
			process.removeAllListeners(signal)
		})
		if (!this.server) {
			return
		}
		return new Promise((done, fail) => {
			this.server.close((err) => {
				if (err) {
					fail(err)
				}
				done()
			})
		})
	}

	newDataUnionClient(chain /* config.Chain */, privateKey /* string */) {
		const options = {
			auth: {
				privateKey,
			},
			network: {
				name: chain.name,
				chainId: chain.id,
				rpcs: chain.rpcEndpoints,
			}
		}
		return new DataUnionClient(options)
	}

	routes() {
		this.expressApp.use(express.json({
			limit: '1kb',
		}))
		this.expressApp.use((req, res, next) => this.signedRequestValidator(req).then(next).catch((err) => next(err)))
		this.expressApp.post('/join', (req, res, next) => this.joinRequest(req, res, next))
		this.customRoutes(this.expressApp)
		this.expressApp.use(rest.error(this.logger))
	}

	start() {
		const backlog = 511
		return new Promise((done, fail) => {
			this.server = this.expressApp.listen(this.port, backlog, (err) => {
				if (err) {
					fail(err)
				}
				this.logger.info(`HTTP server started on port: ${this.port}`)
				done()
			})
		})
	}

	sendJsonResponse(res, status, response) {
		res.set('content-type', 'application/json')
		res.status(status)
		res.send(response)
	}

	sendJsonError(res, status, message) {
		const errorMessage = new rest.ErrorMessage(message)
		this.sendJsonResponse(res, status, errorMessage)
	}

	async joinRequest(req, res, _next) {
		let member
		try {
			member = new domain.Address(req.body.address)
		} catch (err) {
			this.sendJsonError(res, 400, `Invalid member address: '${err.address}'`)
			return
		}

		let dataUnion
		try {
			dataUnion = new domain.Address(req.validatedRequest.dataUnion)
		} catch (err) {
			this.sendJsonError(res, 400, `Invalid Data Union contract address: '${err.address}'`)
			return
		}

		let chain
		try {
			chain = domain.Chain.fromName(req.validatedRequest.chain)
		} catch (err) {
			this.sendJsonError(res, 400, `Invalid chain name: '${req.validatedRequest.chain}'`)
			return
		}

		try {
			await this.customJoinRequestValidator(req.body.address, req.validatedRequest)
		} catch (err) {
			this.sendJsonError(res, 400, `Join request failed custom validation: '${err}'`)
			return
		}

		try {
			const joinResponse = await this.joinRequestService.create(member.toString(), dataUnion.toString(), chain.toString())
			this.logger.info(joinResponse)
			this.sendJsonResponse(res, 200, joinResponse)
		} catch(err) {
			this.logger.info(err)
			this.sendJsonError(res, 400, err.message)
		}
	}
}

module.exports = {
	JoinServer,
}
