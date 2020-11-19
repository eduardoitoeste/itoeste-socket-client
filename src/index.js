import Ws from '@adonisjs/websocket-client';

export default class SocketConnection {
	constructor(config){
		// this.wsProtocol = config.wsProtocol
		// this.route = config.route
		this.token = config.token
		this.debug = config.debug ? true : false
		this.channelPrefix = ""
		this.connect()
	}

	connect () {
		let that = this
		this.ws = Ws('ws://157.245.219.22')
	 	.withApiToken(this.token)
      	.connect();

      	this.ws.on('open', () => {
      		that.debugLog("log","Connection initialized")
      		that.config()
    	});

    	this.ws.on('close', () => {
      		that.debugLog("error","Connection closed")
    	});


      	return this.ws
	}

	config () {
		let that = this
		const channel = this.ws.subscribe("config-init");
		channel.emit('message','init')
		channel.on('message', message => {
			that.channelPrefix = message
		});
		return channel
	}

	subscribeChannel (channelName,callback) {
		let that = this
		if(this.channelPrefix == ""){
			setTimeout(() => {
				const channel = that.subscribeChannel(channelName,callback);
			}, 1000)
		}else{
			let channelTemp = 'channel:'+this.channelPrefix+'-'+channelName
			const channel = that.ws.subscribe(channelTemp);

			channel.on('message', message => {
	        	callback(message)
	      	});
			
			return channel
		}
		
	}

	debugLog(type,data){
		if(this.debug){
			if(type == "log"){
				console.log(data)
			}

			if(type == "warn"){
				console.warn(data)
			}

			if(type == "error"){
				console.error(data)
			}
		}
	}
}