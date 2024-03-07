package broadcast

import "github.com/gin-gonic/gin"

func Register(app *gin.RouterGroup) {
	app.GET("/broadcast/view", ViewBroadcastAPI)
	app.GET("/broadcast/list", GetBroadcastListAPI)
	app.POST("/broadcast/create", CreateBroadcastAPI)
}
