# Bunn Ops Observatory (V1)

独立后台项目，包含：
- tableman 全库 CRUD（表浏览、筛选、分页、主键批量删除）
- 部署日志（从 workflow 记录聚合）
- 应用日志（数据库日志表 + Redis 可用性 + SSH 拉取 VPS docker logs）

## 安全原则（重要）

- 生产 Postgres / Redis **不开放公网访问**。
- 本地开发允许“直连生产资源”，但必须基于 **SSH 隧道**。
- 访问流程和命令模板见 `RUNBOOK.md`。

## 本地开发

1. 复制环境变量：

```bash
cp .env.example .env.local
```

2. 填写 `.env.local` 中的 `DATABASE_URL`、`REDIS_URL`、`GITHUB_TOKEN`、`GITHUB_OWNER`、`GITHUB_REPO`。默认仓库为 `chenbj5515/bunn-aws`。
3. 如果要在 logs 页面查看 VPS docker logs，需要额外配置：
   - `SSH_DOCKER_LOGS_ENABLED=true`
   - `VPS_HOST`、`VPS_PORT`、`VPS_USER`
   - （可选）`VPS_SSH_KEY_PATH`

4. 启动开发：

```bash
pnpm install
pnpm dev
```

5. 打开：

```text
http://localhost:3000
```

## 主要目录

- `src/app/(dashboard)`：后台页面（overview / deployments / logs / tables）
- `src/app/api/tables`：tableman API
- `src/app/api/ops`：运维数据 API
- `src/components/tableman`：tableman UI 组件
- `src/lib`：db / redis / github client

## 部署（独立 compose）

```bash
pnpm docker:up
```

或：

```bash
./deploy.sh deploy
```
