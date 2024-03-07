package conversation

import (
	"chat/auth"
	"chat/globals"
	"chat/utils"
	"database/sql"
	"errors"
	"strings"
)

const defaultConversationName = "new chat"
const defaultConversationContext = 8

type Conversation struct {
	Auth      bool              `json:"auth"`
	UserID    int64             `json:"user_id"`
	Id        int64             `json:"id"`
	Name      string            `json:"name"`
	Message   []globals.Message `json:"message"`
	Model     string            `json:"model"`
	EnableWeb bool              `json:"enable_web"`
	Shared    bool              `json:"shared"`
	Context   int               `json:"context"`
}

type FormMessage struct {
	Type          string `json:"type"`
	Message       string `json:"message"`
	Web           bool   `json:"web"`
	Model         string `json:"model"`
	IgnoreContext bool   `json:"ignore_context"`
	Context       int    `json:"context"`
}

func NewAnonymousConversation() *Conversation {
	return &Conversation{
		Auth:    false,
		UserID:  -1,
		Id:      -1,
		Name:    defaultConversationName,
		Message: []globals.Message{},
		Model:   globals.GPT3Turbo,
		Context: defaultConversationContext,
	}
}

func NewConversation(db *sql.DB, id int64) *Conversation {
	return &Conversation{
		Auth:    true,
		UserID:  id,
		Id:      GetConversationLengthByUserID(db, id) + 1,
		Name:    defaultConversationName,
		Message: []globals.Message{},
		Model:   globals.GPT3Turbo,
	}
}

func ExtractConversation(db *sql.DB, user *auth.User, id int64, ref string) *Conversation {
	if ref != "" {
		if instance := UseSharedConversation(db, user, ref); instance != nil {
			return instance
		}
	}

	if user == nil {
		return NewAnonymousConversation()
	}

	if id == -1 {
		// create new conversation
		return NewConversation(db, user.GetID(db))
	}

	// load conversation
	if instance := LoadConversation(db, user.GetID(db), id); instance != nil {
		return instance
	} else {
		return NewConversation(db, user.GetID(db))
	}
}

func (c *Conversation) GetModel() string {
	if len(c.Model) == 0 {
		return globals.GPT3Turbo
	}
	return c.Model
}

func (c *Conversation) IsEnableWeb() bool {
	return c.EnableWeb
}

func (c *Conversation) GetContextLength() int {
	return c.Context
}

func (c *Conversation) SetModel(model string) {
	if len(model) == 0 {
		model = globals.GPT3Turbo
	}
	c.Model = model
}

func (c *Conversation) SetEnableWeb(enable bool) {
	c.EnableWeb = enable
}

func (c *Conversation) SetContextLength(context int) {
	c.Context = context
}

func (c *Conversation) GetName() string {
	return c.Name
}

func (c *Conversation) SetName(db *sql.DB, name string) {
	c.Name = utils.Extract(name, 50, "...")
	c.SaveConversation(db)
}

func (c *Conversation) GetId() int64 {
	return c.Id
}

func (c *Conversation) GetUserID() int64 {
	return c.UserID
}

func (c *Conversation) SetId(id int64) {
	c.Id = id
}

func (c *Conversation) GetMessage() []globals.Message {
	return c.Message
}

func (c *Conversation) GetMessageById(id int) globals.Message {
	return c.Message[id]
}

func (c *Conversation) GetMessageLength() int {
	return len(c.Message)
}

func (c *Conversation) GetMessageSegment(length int) []globals.Message {
	if length > len(c.Message) {
		return c.Message
	}
	return c.Message[len(c.Message)-length:]
}

func (c *Conversation) GetChatMessage() []globals.Message {
	return c.GetMessageSegment(c.GetContextLength())
}

func CopyMessage(message []globals.Message) []globals.Message {
	return utils.DeepCopy[[]globals.Message](message) // deep copy
}

func (c *Conversation) GetLastMessage() globals.Message {
	return c.Message[len(c.Message)-1]
}

func (c *Conversation) AddMessage(message globals.Message) {
	c.Message = append(c.Message, message)
}

func (c *Conversation) AddMessages(messages []globals.Message) {
	c.Message = append(c.Message, messages...)
}

func (c *Conversation) InsertMessage(message globals.Message, index int) {
	c.Message = append(c.Message[:index], append([]globals.Message{message}, c.Message[index:]...)...)
}

func (c *Conversation) InsertMessages(messages []globals.Message, index int) {
	c.Message = append(c.Message[:index], append(messages, c.Message[index:]...)...)
}

func (c *Conversation) AddMessageFromUser(message string) {
	c.AddMessage(globals.Message{
		Role:    globals.User,
		Content: message,
	})
}

func (c *Conversation) AddMessageFromAssistant(message string) {
	c.AddMessage(globals.Message{
		Role:    globals.Assistant,
		Content: message,
	})
}

func (c *Conversation) AddMessageFromSystem(message string) {
	c.AddMessage(globals.Message{
		Role:    globals.System,
		Content: message,
	})
}

func GetMessage(data []byte) (string, error) {
	form, err := utils.Unmarshal[FormMessage](data)
	form.Message = strings.TrimSpace(form.Message)
	if err != nil {
		return "", err
	}
	if len(form.Message) == 0 {
		return "", errors.New("message is empty")
	}
	return form.Message, nil
}

func (c *Conversation) AddMessageFromByte(data []byte) (string, error) {
	form, err := utils.Unmarshal[FormMessage](data)
	if err != nil {
		return "", err
	} else if len(form.Message) == 0 {
		return "", errors.New("message is empty")
	}

	c.AddMessageFromUser(form.Message)
	c.SetModel(form.Model)
	c.SetEnableWeb(form.Web)

	if form.IgnoreContext {
		form.Context = 1
	} else if form.Context <= 0 {
		form.Context = defaultConversationContext
	}

	c.SetContextLength(form.Context)
	return form.Message, nil
}

func (c *Conversation) AddMessageFromForm(form *FormMessage) error {
	if len(form.Message) == 0 {
		return errors.New("message is empty")
	}

	c.AddMessageFromUser(form.Message)
	c.SetModel(form.Model)
	c.SetEnableWeb(form.Web)
	if form.IgnoreContext {
		form.Context = 1
	} else if form.Context <= 0 {
		form.Context = defaultConversationContext
	}

	c.SetContextLength(form.Context)
	return nil
}

func (c *Conversation) HandleMessage(db *sql.DB, form *FormMessage) bool {
	head := len(c.Message) == 0 || c.Name == defaultConversationName
	if err := c.AddMessageFromForm(form); err != nil {
		return false
	}
	if head {
		c.SetName(db, form.Message)
	}
	c.SaveConversation(db)
	return true
}

func (c *Conversation) HandleMessageFromByte(db *sql.DB, data []byte) bool {
	head := len(c.Message) == 0
	msg, err := c.AddMessageFromByte(data)
	if err != nil {
		return false
	}
	if head {
		c.SetName(db, msg)
	}
	c.SaveConversation(db)
	return true
}

func (c *Conversation) GetLatestMessage() string {
	return c.Message[len(c.Message)-1].Content
}

func (c *Conversation) SaveResponse(db *sql.DB, message string) {
	c.AddMessageFromAssistant(message)
	c.SaveConversation(db)
}

func (c *Conversation) RemoveMessage(index int) globals.Message {
	if index < 0 || index >= len(c.Message) {
		return globals.Message{}
	}
	message := c.Message[index]
	c.Message = append(c.Message[:index], c.Message[index+1:]...)
	return message
}

func (c *Conversation) RemoveLatestMessage() globals.Message {
	return c.RemoveMessage(len(c.Message) - 1)
}
