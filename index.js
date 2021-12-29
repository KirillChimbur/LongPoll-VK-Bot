const start = performance.now(),
	longpoll = new (require('./api/LongPoll'))(),
	fs = require('fs')

console.clear()
console.log('\033[36m[INFO] \033[33mБот успешно запустился!\n\033[36m[INFO] \033[33mВремя запуска: \033[36m' + ((performance.now() - start) / 1000).toFixed(3) + ' сек.\033[0m')

longpoll.start()

longpoll.on('update', async(updates = {}) => {
	switch (updates.type ?? '') {
		case 'message_new':
			const msg = updates.object.message
			if (msg.from_id < 0) return
			if (msg.text) {
				const [user] = await longpoll.call('users.get', {
					user_id: msg.from_id
				}), name = '[id' + msg.from_id + '|' + user.first_name + ']'
				msg.params = msg.text.split(' ')
				if ((msg.params[0] ?? '').match(/^(hello|привет)$/i)) {
					longpoll.send(msg.peer_id, name + ', Привет!', {
						disable_mentions: 1
					})
				}
			}
	}
})
