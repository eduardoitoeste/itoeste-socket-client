import io from 'socket.io-client';
// const io = require('socket.io-client');
class SocketConnection {
	constructor(config,callback=""){
		// this.wsProtocol = config.wsProtocol
		// this.route = config.route
		this.token = config.token
		this.debug = config.debug ? true : false
		this.channelPrefix = ""
		this.subscriptions = []
		this.callback = callback
		this.connect()
		this.interval = null
	}

	connect(){
		let that = this
		this.ws = io.connect('https://socket.sistemaiea.com', { 
			'forceNew': true ,
			auth: {
			    token: that.token
			},
			// query: {
   //  			token: that.token
  	// 		}
  		});

  		this.ws.on('connect', (socket) => {
  			if(this.interval){
  				clearInterval(this.interval);
  			}
		  // let token = socket.handshake.query.token;
		  that.debugLog("log","Conectado con el servidor")
		  
		  that.callback({
		  	connect:true,
		  	status:200,
		  	socket:that.ws.id,
		  	message:"Conectado"
		  })
		  that.config()
		});

		

		this.ws.on('disconnect', (reason) => {
		  that.debugLog("error",reason)
		  if (reason === 'io server disconnect') {
		    // the disconnection was initiated by the server, you need to reconnect manually
		    that.debugLog("log","Intentando conectar al servidor...")
		    // socket.connect();
		  }
		  that.channelPrefix = ""
		  that.reconnect()
		  that.callback({
		  	connect:false,
		  	status:500,
		  	socket:that.ws.id,
		  	message:"Desconectado"
		  })
		});
	}

	config(){
		let that = this
		that.ws.on('config-init', (data) => {
		  if(data.status == 401){
		  	that.callback({
		  	  connect:false,
			  status:401,
			  socket:that.ws.id,
			  message:data.message
			})

			that.debugLog("error","Error de autentificacion, sera desconectado del servidor  ERROR : "+data.message)
			that.ws.disconnect();
		  }
		  if(data.status == 200){
		  	that.channelPrefix = data.message
		  	that.debugLog("log","Cliente configurado en "+that.channelPrefix)

		  }
		});
	}

	reconnect(){
		let that = this
		this.interval = setInterval(() => {
			that.debugLog("log","Intentando reconectar al servidor...")
  			that.ws.disconnect()
  			that.connect()
		}, 1000);
	}

	subscribeChannel (channelName,callback) {
		let that = this
		if(this.channelPrefix == ""){
			setTimeout(() => {
				that.debugLog("error","El servidor no ha terminado de configurar")
				that.config()
				that.subscribeChannel(channelName,callback)
			},1000)
			return
		}

		let channel = 'channel-'+this.channelPrefix+'-'+channelName
		that.debugLog("log","Escuchando el canal "+channel)
		this.ws.on(channel, (data) => {
		  callback(data)
		});

	}

	disconnect(){
		this.ws.disconnect()
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


	sendError(data){
		this.debugLog("log",process.platform)
		let that = this
		let system = {}
		if(!this.ws){
			return {status:500}
		}

		system = {
			platform:process.platform,
		}

		if(process.platform == "browser"){
			system = {
				platform:process.platform,
				data:{
					appCodeName: window.navigator.appCodeName,
				    appName: window.navigator.appName,
				    appVersion: window.navigator.appVersion,
				    platform: window.navigator.platform,
				    userAgent: window.navigator.userAgent
				}
				
			}
		}else if(process.platform == "win32" || process.platform == "linux" || process.platform == "darwin"){
			const os = require('os');
			system = {
				platform:process.platform,
				data:{
					arch: process.arch,
				    cpu: os.cpus()[0].model,
				    // network: dns.networkInterfaces(),
				}
				
			}
		}else{
			if(!process.platform){
				// const {Platform} = require('react-native/index');
				//   if(Platform){
				//   	system = {
				// 		platform:Platform.OS,
				// 		data:{
				// 			Version: Platform.Version,
				// 		    constants:Platform.constants
				// 		}
						
				// 	}
				//   }
			  
			}
		}

		system.type = data.type
		system.status = data.status
		system.mode = data.mode
		system.message =  data.message
		system.url =  data.url ? data.url : ""
		system.dataUrl =  data.dataUrl ? data.dataUrl : ""
		let channel = 'log-register'
		this.ws.emit(channel,system)
		this.debugLog("log",system)
		return {status:200} 
	}
}

export default function (config,callback="") {
  return new SocketConnection(config,callback)
}


// module.exports = function (config,callback="") {
//   return new SocketConnection(config,callback)
// }