import colyseus from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import cors from "cors";
import config from "./config";
/**
 * Import your Room files
 */
import { GameRoom } from "./rooms/GameRoom";
export default colyseus({
	initializeGameServer: (gameServer) => {
		/**
		 * Define your room handlers:
		 */
		gameServer.define("my_room", GameRoom);
	},

	initializeExpress: (app) => {
		/**
		 * Bind your custom express routes here:
		 * Read more: https://expressjs.com/en/starter/basic-routing.html
		 */
		// app.get("/hello_world", (req, res) => {
		// 	res.send("It's time to kick ass and chew bubblegum!");
		// });

		/**
		 * Use @colyseus/playground
		 * (It is not recommended to expose this route in a production environment)
		 */
		if (config.playground) {
			app.use("/", playground());
		}

		/**
		 * Use @colyseus/monitor
		 * It is recommended to protect this route with a password
		 * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
		 */
		app.use("/monitor", monitor());

		app.use(cors(config.cors));
	},

	beforeListen: () => {
		/**
		 * Before before gameServer.listen() is called.
		 */
	},
});
