package connection

import (
	"chat/globals"
	"chat/utils"
	"database/sql"
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"github.com/spf13/viper"
)

var DB *sql.DB

func InitMySQLSafe() *sql.DB {
	ConnectMySQL()

	// using DB as a global variable to point to the latest db connection
	MysqlWorker(DB)
	return DB
}

func ConnectMySQL() *sql.DB {
	// connect to MySQL
	db, err := sql.Open("mysql", fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s",
		viper.GetString("mysql.user"),
		viper.GetString("mysql.password"),
		viper.GetString("mysql.host"),
		viper.GetInt("mysql.port"),
		viper.GetString("mysql.db"),
	))
	if pingErr := db.Ping(); err != nil || pingErr != nil {
		errMsg := utils.Multi[string](err != nil, utils.GetError(err), utils.GetError(pingErr)) // err.Error() may contain nil pointer
		globals.Warn(
			fmt.Sprintf("[connection] failed to connect to mysql server: %s (message: %s), will retry in 5 seconds",
				viper.GetString("mysql.host"), errMsg,
			),
		)

		utils.Sleep(5000)
		db.Close()

		return ConnectMySQL()
	} else {
		globals.Debug(fmt.Sprintf("[connection] connected to mysql server (host: %s)", viper.GetString("mysql.host")))
	}

	db.SetMaxOpenConns(512)
	db.SetMaxIdleConns(64)

	CreateUserTable(db)
	CreateConversationTable(db)
	CreateSharingTable(db)
	CreatePackageTable(db)
	CreateQuotaTable(db)
	CreateSubscriptionTable(db)
	CreateApiKeyTable(db)
	CreateInvitationTable(db)
	CreateRedeemTable(db)
	CreateBroadcastTable(db)

	DB = db

	return db
}

func InitRootUser(db *sql.DB) {
	// create root user if totally empty
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM auth").Scan(&count)
	if err != nil {
		globals.Warn(fmt.Sprintf("[service] failed to query user count: %s", err.Error()))
		return
	}

	if count == 0 {
		globals.Debug("[service] no user found, creating root user (username: root, password: chatnio123456, email: root@example.com)")
		_, err := db.Exec(`
			INSERT INTO auth (username, password, email, is_admin, bind_id, token)
			VALUES (?, ?, ?, ?, ?, ?)
		`, "root", utils.Sha2Encrypt("chatnio123456"), "root@example.com", true, 0, "root")
		if err != nil {
			globals.Warn(fmt.Sprintf("[service] failed to create root user: %s", err.Error()))
		}
	} else {
		globals.Debug(fmt.Sprintf("[service] %d user(s) found, skip creating root user", count))
	}
}

func CreateUserTable(db *sql.DB) {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS auth (
		  id INT PRIMARY KEY AUTO_INCREMENT,
		  bind_id INT UNIQUE,
		  username VARCHAR(24) UNIQUE,
		  token VARCHAR(255) NOT NULL,
		  email VARCHAR(255) UNIQUE,
		  password VARCHAR(64) NOT NULL,
		  is_admin BOOLEAN DEFAULT FALSE,
		  is_banned BOOLEAN DEFAULT FALSE
		);
	`)
	if err != nil {
		fmt.Println(err)
	}

	InitRootUser(db)
}

func CreatePackageTable(db *sql.DB) {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS package (
		  id INT PRIMARY KEY AUTO_INCREMENT,
		  user_id INT,
		  type VARCHAR(255),
		  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		  FOREIGN KEY (user_id) REFERENCES auth(id),
		  UNIQUE KEY (user_id, type)
		);
	`)
	if err != nil {
		fmt.Println(err)
	}
}

func CreateQuotaTable(db *sql.DB) {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS quota (
		  id INT PRIMARY KEY AUTO_INCREMENT,
		  user_id INT UNIQUE,
		  quota DECIMAL(16, 4),
		  used DECIMAL(16, 4),
		  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		  FOREIGN KEY (user_id) REFERENCES auth(id)
		);
	`)
	if err != nil {
		fmt.Println(err)
	}
}

func CreateConversationTable(db *sql.DB) {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS conversation (
		  id INT PRIMARY KEY AUTO_INCREMENT,
		  user_id INT,
		  conversation_id INT,
		  conversation_name VARCHAR(255),
		  data MEDIUMTEXT,
		  model VARCHAR(255) NOT NULL DEFAULT 'gpt-3.5-turbo-0613',
		  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		  UNIQUE KEY (user_id, conversation_id)
		);
	`)
	if err != nil {
		fmt.Println(err)
	}
}

func CreateSharingTable(db *sql.DB) {
	// refs is an array of message id, separated by comma (-1 means all messages)
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS sharing (
		  id INT PRIMARY KEY AUTO_INCREMENT,
		  hash CHAR(32) UNIQUE,
		  user_id INT,
		  conversation_id INT,
		  refs TEXT,
		  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		  FOREIGN KEY (user_id) REFERENCES auth(id)
		);
	`)
	if err != nil {
		fmt.Println(err)
	}
}

func CreateSubscriptionTable(db *sql.DB) {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS subscription (
		  id INT PRIMARY KEY AUTO_INCREMENT,
		  level INT DEFAULT 1,
		  user_id INT UNIQUE,
		  expired_at DATETIME,
		  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		  total_month INT DEFAULT 0,
		  enterprise BOOLEAN DEFAULT FALSE,
		  FOREIGN KEY (user_id) REFERENCES auth(id)
		);
	`)
	if err != nil {
		fmt.Println(err)
	}
}

func CreateApiKeyTable(db *sql.DB) {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS apikey (
		  id INT PRIMARY KEY AUTO_INCREMENT,
		  user_id INT UNIQUE,
		  api_key VARCHAR(255) UNIQUE,
		  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		  FOREIGN KEY (user_id) REFERENCES auth(id)
		);
	`)
	if err != nil {
		fmt.Println(err)
	}
}

func CreateInvitationTable(db *sql.DB) {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS invitation (
		  id INT PRIMARY KEY AUTO_INCREMENT,
		  code VARCHAR(255) UNIQUE,
		  quota DECIMAL(12, 4),
		  type VARCHAR(255),
		  used BOOLEAN DEFAULT FALSE,
		  used_id INT,
		  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		  UNIQUE KEY (used_id, type),
		  FOREIGN KEY (used_id) REFERENCES auth(id)
		);
	`)
	if err != nil {
		fmt.Println(err)
	}
}

func CreateRedeemTable(db *sql.DB) {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS redeem (
		  id INT PRIMARY KEY AUTO_INCREMENT,
		  code VARCHAR(255) UNIQUE,
		  quota DECIMAL(12, 4),
		  used BOOLEAN DEFAULT FALSE,
		  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		fmt.Println(err)
	}
}

func CreateBroadcastTable(db *sql.DB) {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS broadcast (
		  id INT PRIMARY KEY AUTO_INCREMENT,
		  poster_id INT,
		  content TEXT,
		  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		  FOREIGN KEY (poster_id) REFERENCES auth(id)
		);
	`)
	if err != nil {
		fmt.Println(err)
	}
}
