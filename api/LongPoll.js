const EventEmitter = require('events'),
	request = require('request'),
	fs = require('fs'),
	config = fs.readFileSync('./config.json', 'utf8')

module.exports = class extends EventEmitter {
	access_token = JSON.parse(config).access_token
	group_id = JSON.parse(config).group_id
	call(method, obj = {}) {
		return new Promise((resolve, reject) => {
			request.post('https://api.vk.com/method/' + method, {
				json: true,
				formData: Object.assign({
					v: 5.131,
					access_token: this.access_token,
				}, obj)
			}, (error, request) => {
				if (error != null || request.statusCode != 200) {
					reject(error == null ? request : error)
				} else if (request.body.response != undefined) {
					resolve(request.body.response)
				} else reject(request.body)
			})
		})
	}
	start(server = null, key = null, ts = null) {
		if (server == null || key == null || ts == null) return request('https://api.vk.com/method/groups.getLongPollServer', {
			method: 'POST',
			json: true,
			form: {
				access_token: this.access_token,
				group_id: this.group_id,
				v: 5.131
			}
		}, (error, response) => {
			if (error != null || response.statusCode != 200) return setTimeout(() => this.start(server, key, ts), 500)
			this.start(server ?? response.body.response.server, key ?? response.body.response.key, ts ?? response.body.response.ts)
		})
		request(server + '?act=a_check&wait=25&key=' + key + '&ts=' + ts, {
			json: true,
			timeout: 30000
		}, (error, response) => {
			if (error != null || response.statusCode != 200) return setTimeout(() => this.start(server, key, ts), 500)
			if (response.body.failed == 1) return this.start(server, key, response.body.ts)
			if (response.body.failed == 2) return this.start(server, null, ts)
			if (response.body.failed == 3) return this.start(server, null, null)
			this.start(server, key, response.body.ts ?? ts)
			if (response.body.updates != null) response.body.updates.forEach((update) => this.emit('update', update))
		})
	}
	send(peer_id, message, obj = {}) {
		return this.call('messages.send', Object.assign({
			peer_id: peer_id,
			message: message,
			random_id: 0
		}, obj))
	}
}
