import Ws from '@adonisjs/websocket-client';
// import Ws from '../lib//adonisjs/websocket-client';
class SocketConnection {
	constructor(config,callback=""){
		// this.wsProtocol = config.wsProtocol
		// this.route = config.route
		this.token = config.token
		this.debug = config.debug ? true : false
		this.channelPrefix = ""
		this.subscriptions = []
		this.connect()
	}

	connect () {
		let that = this
		this.ws = Ws('ws://157.245.219.22')
	 	.withApiToken(this.token)
      	.connect();

      	this.ws.on('open', (data) => {
      		that.debugLog("log","Connection initialized")
			  that.config()
			  
			  let dataRes = {
					status : 1,
					data: data
				}
				if(that.callback){
				that.callback(dataRes)
				}	
    	});

    	this.ws.on('close', (data) => {
			  that.debugLog("error","Connection closed")
			  
			  let dataRes = {
				  status : 0,
				  data: data
			  }
			  if(that.callback){
				that.callback(dataRes)
			  }
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
			return
		}

		const found = this.subscriptions.find(element => element.channel == channelName);
		
		let index = this.subscriptions.indexOf( found )
		if(found){
			  this.debugLog("log","Ya existe una subscripcion para "+channelName)
			  let channelTemp = 'channel:'+this.channelPrefix+'-'+channelName
			  const channel = this.ws.getSubscription(channelTemp);
			//   channel.on('message', (message) => {
			// 	callback(message)
			//  })
		}else{
			this.debugLog("log","Creando subscripcion para "+channelName)
			let channelTemp = 'channel:'+this.channelPrefix+'-'+channelName
			const channel = this.ws.subscribe(channelTemp);
			this.subscriptions.push({'channel':channelName,data:channel})
			channel.on('message', message => {
				callback(message)
			});
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

export default function (config,callback="") {
  return new SocketConnection(config,callback)
}