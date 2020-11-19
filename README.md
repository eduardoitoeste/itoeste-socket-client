example:

	import SocketConnection from "itoeste-socket"

	let socket = global.Socket = new SocketConnection({
  		token:'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  		debug:true // true o false
	})

	let channel = socket.subscribeChannel('test',(data)=>{
  		console.log("test",data)
	})