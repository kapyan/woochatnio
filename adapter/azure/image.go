package azure

import (
	"chat/globals"
	"chat/utils"
	"fmt"
	"strings"
)

type ImageProps struct {
	Model  string
	Prompt string
	Size   ImageSize
}

func (c *ChatInstance) GetImageEndpoint(model string) string {
	model = strings.ReplaceAll(model, ".", "")
	return fmt.Sprintf("%s/openai/deployments/%s/images/generations?api-version=%s", c.GetResource(), model, c.GetEndpoint())
}

// CreateImageRequest will create a dalle image from prompt, return url of image and error
func (c *ChatInstance) CreateImageRequest(props ImageProps) (string, error) {
	res, err := utils.Post(
		c.GetImageEndpoint(props.Model),
		c.GetHeader(), ImageRequest{
			Prompt: props.Prompt,
			Size: utils.Multi[ImageSize](
				props.Model == globals.Dalle3,
				ImageSize1024,
				ImageSize512,
			),
			N: 1,
		})
	if err != nil || res == nil {
		return "", fmt.Errorf("chatgpt error: %s", err.Error())
	}

	data := utils.MapToStruct[ImageResponse](res)
	if data == nil {
		return "", fmt.Errorf("chatgpt error: cannot parse response")
	} else if data.Error.Message != "" {
		return "", fmt.Errorf("chatgpt error: %s", data.Error.Message)
	}

	return data.Data[0].Url, nil
}

// CreateImage will create a dalle image from prompt, return markdown of image
func (c *ChatInstance) CreateImage(props *ChatProps) (string, error) {
	url, err := c.CreateImageRequest(ImageProps{
		Model:  props.Model,
		Prompt: c.GetLatestPrompt(props),
	})
	if err != nil {
		if strings.Contains(err.Error(), "safety") {
			return err.Error(), nil
		}
		return "", err
	}

	return utils.GetImageMarkdown(url), nil
}
