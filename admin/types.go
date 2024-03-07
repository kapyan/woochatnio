package admin

var pagination int64 = 10

type InfoForm struct {
	BillingToday      float32 `json:"billing_today"`
	BillingMonth      float32 `json:"billing_month"`
	SubscriptionCount int64   `json:"subscription_count"`
}

type ModelData struct {
	Model string  `json:"model"`
	Data  []int64 `json:"data"`
}

type ModelChartForm struct {
	Date  []string    `json:"date"`
	Value []ModelData `json:"value"`
}

type RequestChartForm struct {
	Date  []string `json:"date"`
	Value []int64  `json:"value"`
}

type BillingChartForm struct {
	Date  []string  `json:"date"`
	Value []float32 `json:"value"`
}

type ErrorChartForm struct {
	Date  []string `json:"date"`
	Value []int64  `json:"value"`
}

type PaginationForm struct {
	Status  bool          `json:"status"`
	Total   int           `json:"total"`
	Data    []interface{} `json:"data"`
	Message string        `json:"message"`
}

type InvitationData struct {
	Code      string  `json:"code"`
	Quota     float32 `json:"quota"`
	Type      string  `json:"type"`
	Used      bool    `json:"used"`
	UpdatedAt string  `json:"updated_at"`
}

type RedeemData struct {
	Quota float32 `json:"quota"`
	Used  float32 `json:"used"`
	Total float32 `json:"total"`
}

type InvitationGenerateResponse struct {
	Status  bool     `json:"status"`
	Message string   `json:"message"`
	Data    []string `json:"data"`
}

type RedeemGenerateResponse struct {
	Status  bool     `json:"status"`
	Message string   `json:"message"`
	Data    []string `json:"data"`
}

type UserData struct {
	Id           int64   `json:"id"`
	Username     string  `json:"username"`
	IsAdmin      bool    `json:"is_admin"`
	Quota        float32 `json:"quota"`
	UsedQuota    float32 `json:"used_quota"`
	IsSubscribed bool    `json:"is_subscribed"`
	TotalMonth   int64   `json:"total_month"`
	Enterprise   bool    `json:"enterprise"`
	Level        int     `json:"level"`
}
