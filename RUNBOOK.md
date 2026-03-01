# Bunn Ops 访问与运维手册

## 1. 原则

- 生产 DB/Redis 端口不对公网开放。
- 本地访问生产资源时统一走 SSH 隧道。
- 严禁把生产凭据提交到仓库。

## 2. 本地连生产资源（SSH 隧道）

推荐方式（自动脚本）：

```bash
pnpm tunnel:up
# 检查状态
pnpm tunnel:status
```

停止隧道：

```bash
pnpm tunnel:down
```

等价手动方式（备用）：

```bash
ssh -N -L 15432:127.0.0.1:5432 -L 16379:127.0.0.1:6379 user@your-vps-host
```

说明：
- `pnpm tunnel:up` 默认会优先通过 `docker inspect` 解析 `bunn-postgres` / `bunn-redis` 容器 IP 再转发。
- 如需自定义容器名或关闭该行为，可在 `.env` 设置 `DB_CONTAINER_NAME` / `REDIS_CONTAINER_NAME` / `TUNNEL_USE_DOCKER_IP`。

在 `.env.local` 中指向本地映射端口：

```bash
DATABASE_URL=postgresql://user:password@127.0.0.1:15432/db_name
REDIS_URL=redis://127.0.0.1:16379
```

最后启动（可选一键）：

```bash
# 先起隧道再启动开发服务
pnpm dev:with-tunnel

# 或者你已经单独执行过 pnpm tunnel:up
pnpm dev
```

访问：

```text
http://localhost:3000
```

## 3. 查看 VPS docker logs（通过 SSH）

在 `.env.local` 增加：

```bash
SSH_DOCKER_LOGS_ENABLED=true
DOCKER_LOG_CONTAINER=bunn-app
VPS_HOST=your-vps-host
VPS_PORT=22
VPS_USER=your-vps-user
# 可选
VPS_SSH_KEY_PATH=/Users/you/.ssh/id_ed25519
```

说明：
- logs 页面切到 `docker_logs` 后，会通过后端执行 `ssh` 到 VPS 拉 `docker logs`。
- 需要本机可直接 `ssh VPS_USER@VPS_HOST`（已配置密钥/known_hosts）。
- 页面默认容器名：`bunn-app`，可在页面输入框改成实际容器名。

## 4. 线上部署（独立 compose）

```bash
./deploy.sh deploy
```

或：

```bash
pnpm docker:up
```

## 5. 常见排障

- DB 连接失败：先确认 SSH 隧道还在，检查 `15432` 端口是否被占用。
- Redis 连接失败：确认 `REDIS_URL` 使用的是隧道映射端口 `16379`。
- GitHub 构建历史拉取失败：检查 `GITHUB_TOKEN` 是否有 `repo` + `actions:read` 权限。
- docker logs 拉取失败：先在终端执行 `ssh VPS_USER@VPS_HOST "docker ps"` 验证连通与权限。
- 页面报 500：看服务日志 `docker compose -f docker-compose.prod.yml logs -f`。
