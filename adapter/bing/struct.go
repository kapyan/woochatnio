package bing

import (
	"chat/globals"
	"fmt"
)

type ChatInstance struct {
	Endpoint string
	Secret   string
}

func (c *ChatInstance) GetEndpoint() string {
	return fmt.Sprintf("%s/chat", c.Endpoint)
}

func NewChatInstance(endpoint, secret string) *ChatInstance {
	return &ChatInstance{
		Endpoint: endpoint,
		Secret:   secret,
	}
}

func NewChatInstanceFromConfig(conf globals.ChannelConfig) *ChatInstance {
	return NewChatInstance(
		conf.GetEndpoint(),
		conf.GetRandomSecret(),
	)
}
