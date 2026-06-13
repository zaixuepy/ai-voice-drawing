# WorkBuddy 指令（Step 4，最终部署）

请将以下项目部署到腾讯云容器服务。

---

## 项目结构

```
voicedraw/
├── frontend/          # React前端（已构建为 frontend/dist/）
├── backend/           # Node.js后端（Express）
├── Dockerfile
├── docker-compose.yml
└── README.md
```

后端在 `backend/server.js` 中同时 serve 前端静态文件（`frontend/dist/` 已被复制到 `backend/public/`）。

---

## Dockerfile（已在项目中，内容如下）

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装后端依赖
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# 构建前端
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# 复制前端构建产物到后端静态目录
RUN mkdir -p backend/public && cp -r frontend/dist/. backend/public/

# 复制后端代码
COPY backend/ ./backend/

EXPOSE 3000

CMD ["node", "backend/server.js"]
```

---

## 环境变量配置

部署时必须配置以下环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | 默认Claude API Key（当用户未配置自己的key时使用） | `sk-ant-...` |
| `PORT` | 服务端口 | `3000` |
| `NODE_ENV` | 环境标识 | `production` |

---

## 部署要求

1. 容器对外暴露 **3000端口**
2. SQLite数据库文件路径：`/app/backend/db/voicedraw.db`，需要挂载持久化存储，防止容器重启后数据丢失
3. 健康检查接口：`GET /api/health`（后端已实现，返回 `{"status":"ok"}`）
4. 容器重启策略：`always`

---

## 验证步骤

部署完成后请验证：

1. 访问根路径 `/`，页面正常加载（显示语音绘图工具界面）
2. 访问 `/api/health`，返回 `{"status":"ok"}`
3. 前端能正常访问（不出现404或502）

---

## 备注

- 前端所有API请求均使用相对路径（`/api/...`），后端统一处理，无跨域问题
- 如果需要HTTPS，在腾讯云负载均衡层配置SSL证书，容器内保持HTTP即可
- 日志输出到stdout，腾讯云容器服务会自动收集
