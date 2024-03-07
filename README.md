<div align="center">

![chatnio](/app/public/logo.png)

## 本项目基于[Deeptrain-Community/chatnio](https://github.com/Deeptrain-Community/chatnio)v3.9修改开源。

## 演示站[哇靠助手](https://wookao.cn)

🚀 强大精美的 **AI聚合** 聊天平台

🚀 Powerful and beautiful **AI Aggregation** chat platform

</div>

## 📝 功能 | Features
1. ✨ **AI 联网功能**
    - ✨ **AI online searching service**
2. ⚡ 多账户均衡负载
   - ⚡ Multi-account load balancing
3. 🎉 HTTP2 Stream 实时响应功能
   - 🎉 HTTP2 Stream real-time response function
4. 🚀 节流和鉴权体系
    - 🚀 Throttling and authentication system
5. 🌈 丰富的聊天功能 (代码高亮，latex支持，卡片生成，右键菜单)
    - 🌈 Rich chat features (code highlight, latex support, card generation, right-click menu)
6. 🎨 多端适配
    - 🎨 Multi-device adaptation
7. 📦 缓存系统
    - 📦 Cache system
8. 🎈 对话记忆功能
    - 🎈 Conversation memorization
9. 👋 对话分享
    - 👋 Conversation sharing
10. 🎁 图片生成功能
     - 🎁 Image generation
11. 🔔 PWA 应用
    - 🔔 PWA application
12. 📚 逆向工程模型支持
    - 📚 Reverse engineering model support
13. 🌏 国际化支持
    - 🌏 Internationalization support
      - 🇨🇳 简体中文
      - 🇺🇸 English
      - 🇷🇺 Русский
14. 🍎 主题切换
    - 🍎 Theme switching
15. 🥪 Key 中转服务
    - 🥪 Key relay service
16. 🔨 多模型支持
    - 🔨 Multi-model support
17. ⚙ 后台管理系统 (仪表盘，用户管理，公告管理等)
    - ⚙ Admin system (dashboard, user management, announcement management, etc.)
18. ⚒ 渠道管理 (多账号均衡负载，优先级调配，权重负载，模型映射，渠道状态管理)
    - ⚒ Channel management (multi-account load balancing, priority allocation, weight load, model mapping, channel status management)
19. ⚡ 计费系统 (支持匿名计费，按次数计费，Token 弹性计费等方式)
    - ⚡ Billing system (support anonymous billing, billing by number of times, Token billing, etc.)
20. 📂 文件上传功能 (支持 pdf, docx, pptx, xlsx, 音频, 图片等)
    - 📂 File upload function (support pdf, docx, pptx, xlsx, audio, images, etc.)
21. 🥪 All in one (支持 smtp 发件，用户管理等功能)
    - 🥪 All in one (supports smtp sending, user management, etc.)


## 🔨 模型 | Models
- [x] OpenAI ChatGPT (GPT-3.5, GPT-4, Instruct, DALL-E 2, DALL-E 3, ...)
- [x] Azure OpenAI
- [x] Anthropic Claude (claude-2, claude-instant)
- [x] Slack Claude (deprecated)
- [x] Sparkdesk (v1.5, v2, v3)
- [x] Google Gemini (PaLM2)
- [x] New Bing (creative, balanced, precise)
- [x] ChatGLM (turbo, pro, std, lite)
- [x] DashScope Tongyi (plus, turbo)
- [x] Midjourney (relax, fast, turbo)
- [x] Stable Diffusion XL
- [x] Tencent Hunyuan
- [x] Baichuan AI
- [x] Douyin Skylark (lite, plus, pro, chat)
- [x] 360 GPT
- [x] LocalAI (RWKV, LLaMa 2, Baichuan 7b, Mixtral, ...) _*requires local deployment_


## 📦 部署 | Deploy
*部署成功后，管理员账号为 `root`，密码默认为 `chatnio123456`*

1. ⚡ Docker Compose 安装 (推荐)
    
    > 运行成功后，宿主机映射地址为 `http://localhost:8000`，使用 Nginx / Apache 进行反代是一个不错的选择（以及 SSL 配置）
    ```shell
    git clone https://github.com/kapyan/woochatnio.git
    cd woochatnio # project directory
    docker-compose up -d # start service in background
    ```
   
   版本更新：
   ```shell
   docker-compose down
   docker-compose pull  # pull latest image
   docker-compose up -d # start service in background
   ```
   
   > - MySQL 数据库挂载目录项目 ~/**db**
   > - Redis 数据库挂载目录项目 ~/**redis**
   > - 配置文件挂载目录项目 ~/**config**

2. ⚒ 编译安装 (自定义性强)
    ```shell
    git clone https://github.com/kapyan/woochatnio.git
    cd woochatnio # project directory
    go build -o woochatnio # build backend
    nohup ./woochatnio > output.log & # run backend
    
    cd app # frontend directory (~/app)
    npm install -g pnpm # install pnpm
    pnpm install # install frontend dependencies
    pnpm build # build frontend
    
    # run frontend
    # a common way is to use nginx/apache to serve the static files
    ```

## 📚 预览 | Screenshots
![landspace](/screenshot/landspace.png)
![feature](/screenshot/code.png)
![latex](/screenshot/latex.jpg)
![generation](/screenshot/generation.png)
![shop](/screenshot/shop.png)
![subscription](/screenshot/subscription.png)
![admin](/screenshot/admin.png)
![channel](/screenshot/channel.png)
![charge](/screenshot/charge.png)

## 🔨 配置 | Config
> Config 配置项可以使用环境变量进行覆盖，如 `MYSQL_HOST` 环境变量可覆盖 `mysql.host` 配置项

~/config/**config.yaml**
```yaml
mysql:
  db: chatnio
  host: localhost
  password: chatnio123456
  port: 3306
  user: root

redis:
  host: localhost
  port: 6379

secret: SbitdyN5ZH39cNxSrG3kMNZ1GfiyyQ43 # jwt secret

auth:
  use_deeptrain: false

server:
  port: 8094
system:
  general:
    backend: ""
  mail:
    host: ""
    port: 465
    username: ""
    password: ""
    from: ""
  search:
    endpoint: https://duckduckgo-api.vercel.app
    query: 5

serve_static: false # serve static files (false if only using backend)
```

## 📚 开发文档 | Docs
[开发文档](https://docs.chatnio.net)


## 📦 技术栈 | Tech Stack
- 前端: React + Radix UI + Tailwind CSS + Redux
- 后端: Golang + Gin + Redis + MySQL + Tiktoken (OpenAI)
- 应用技术: PWA + HTTP2 + WebSocket + Stream Buffer

## 📄 开源协议 | License
Apache License 2.0
