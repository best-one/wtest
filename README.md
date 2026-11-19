<<<<<<< HEAD
# laserconsums
laserconsums website
=======
# Laser Consumables-Better Laser — Hugo + Tailwind v4 + Cloudflare Pages

把 [laserconsums.com](https://laserconsums.com/)（WordPress / Elementor 单页外贸站）转换成当前 Hugo 项目可构建的页面。内容源有两份：**线上抓取的 HTML** 与 **`D:\SDK\site\网站文件备份\domains\laserconsums.com` 的 WordPress 全量备份**（101 MB SQL + `public_html`）。后者是权威基线，比对结论见第 9 节。

> **名词澄清**：Cloudflare **没有**叫「Cloudflare Forms」的内置表单产品（那是 Netlify Forms）。Cloudflare 的做法是「静态表单 + Pages Functions（Workers）+ Turnstile 校验」，提交数据存哪、发给谁由你自己决定。

---

## 1. 内容来源与页面映射

原站是一页式锚点站，本项目保留其完整叙事，同时把内容拆成可独立索引的页面。

| 原站版块（Elementor #680） | 本项目落地位置 |
| --- | --- |
| Hero（背景视频 + Direct Source Factory + 3 条卖点） | `/#home` |
| Professional / 15+ Years / Swift delivery | 首页 Hero 下方 Trust stats |
| Frequent Shutdowns（3 个痛点） | `/#problems` |
| Our Products（8 个产品卡） | `/#product`、`/products/`、**8 个 `/products/<slug>/` 详情页** |
| Fully Customizable（6 项规格 + Before/After 拖动对比） | `/#custom` |
| Our advantage（3 项工艺） | `/#advance` |
| Why choose us（3 条） | `/#why` |
| Our Partners（8 个 logo） | `/#partner` |
| About US（创始人 + 展会/工厂图） | `/#about` 与 `/about/` |
| FAQ（7 组问答） | `/#faq` 与 `/faq/` |
| Want to find the source factory… | `/#factory` |
| 全站 popup 询价弹窗（#901） | 恢复为右下角浮层（延迟 12 秒、可关闭、localStorage 记忆），CTA → `/contact/?ref=popup` → `POST /api/contact` |
| Get Samples Now !（页面内嵌表单） | `/#contact`（首页第二个真实表单） |
| 原站 `/thank-you/`（目录 PDF + WhatsApp 二维码） | `/thank-you/`，`/thanks/` 与 `/contact-thanks` 301 跳转 |

所有文案存放在 `data/*.yaml`，模板只负责排版；改文案不用碰 HTML。

### 图片与静态资源

原站 **40 张图片 + 1 段 Hero 视频 + 1 份产品目录 PDF** 全部落到本地 `static/`，页面不依赖外站：

| 分类 | 文件 | 来自备份 |
| --- | --- | --- |
| 品牌 / Hero | `logo.webp`、`logo-favicon.png`、`hero-bg.webp`、`hero-main.webp` | `2025/11/logo.png`、`cropped-logo.png`、`banner底.jpg`、`d24b04be…jpg` |
| Hero 背景视频 | `media/laserprocessvideo.mp4`（5.95 MB，自动播放 / 封面为 `hero-bg.webp`） | `2025/11/laserprocessvideo.mp4` |
| 痛点 | `problem-nozzle.webp`、`problem-coating.webp` | `2025/12/喷嘴烧毁.jpg`、`2025/11/2.3.jpeg` |
| 产品 | `product-*.png`（8 张） | `2025/12/Frame-3x/4x.png` |
| 定制 / 工艺 | `custom-specs.png`、`advantage-{1..7}.webp` | `2025/11/CleanShot…png`、`Frame-1x/2x.png` |
| 合作方 | `partner-*.png` / `.jpg`（8 张） | `2025/11/*_resized.png`、`Gestamp.jpeg` |
| 关于 / 工厂 | `about-*.png|jpg`、`factory-{1..3}.jpg` | `2025/11/自我介绍.png`、`工厂展示0x.jpg` 等 |
| 产品目录 | `files/Better-Laser-2025.pdf`（12.4 MB） | `2025/11/Better-Laser-2025.pdf` |
| WhatsApp 二维码 | `images/whatsapp-janjung.png` | `2025/11/微信图片_20251124134021_234_39.png` |

其中 13 张虽然原扩展名是 `.jpg/.png`，实际内容是 **WebP**（站点加速器替换过），已按真实字节改成 `.webp` —— 否则 Pages 会按扩展名发 `image/jpeg`，导致部分浏览器解码失败。

配色取自原站 Elementor 全局色：深墨 `#222334`、灰紫 `#616379`、强调橙红 `#ff6347`，定义在 `assets/css/main.css` 的 `@theme` 中。

---

## 2. 目录结构

| 路径 | 作用 |
| --- | --- |
| `hugo.toml` | 站点配置 + Tailwind 集成（buildStats / cachebusters / module.mounts / security.exec） |
| `data/site.yaml` | 品牌、原站导航、Hero、三项统计、About |
| `data/sections.yaml` | 各版块原文标题、底部 CTA、样品表单、popup 文案 |
| `data/thankyou.yaml` | Thank You 页原文、二维码、目录 PDF 路径 |
| `content/products/*.md` | 8 个产品页：标题/副标题/图片/规格/`weight` 全部写在各页 front matter，正文留作描述（可选）。产品列表按 `weight` 排序，模板用 `.Pages` 读取，**不再有 `data/products.yaml`** |
| `data/faq.yaml` | `/faq/` 页的问答条目（仍在用） |
| `data/problems.yaml` / `custom.yaml` / `advantages.yaml` / `why.yaml` / `partners.yaml` | ⚠️ 旧 Tailwind 版遗留，**已无任何模板引用**，改了不会生效 |
| `layouts/index.html` | 首页 12 个版块，按 #680 容器树还原列宽与组件顺序 |
| `layouts/products/{list,single}.html` | 产品目录页与详情页（沿用原站产品卡结构） |
| `layouts/{about,faq,contact,thankyou}/single.html` | 按原站对应版块版式重排的独立页 |
| `layouts/partials/image-compare.html` | **Before/After 拖动对比组件**（原站 twentytwenty） |
| `layouts/partials/quote-popup.html` | 原站 #901 弹窗浮层（`/thank-you/` 不输出） |
| `layouts/partials/contact-form.html` | 共享表单组件（联系页 + 首页样品区两个实例） |
| `layouts/partials/header.html` / `footer.html` | 全站导航（原站 7 项）与 5 列页脚 |
| `layouts/partials/product-card.html` / `faq-list.html` | 原站卡结构（标题→图→全规格→CTA）/ toggle 手风琴 |
| `layouts/shortcodes/*` | 历史兼容保留（当前页面改用 type 专用 layout） |
| `static/js/compare.js` / `popup.js` | 拖动对比交互 / 弹窗延迟与关闭 |
| `static/js/contact.js` | 多表单渐进增强、蜜罐、Turnstile、`?ref=` 来源追踪 |
| `functions/api/contact.js` | 表单后端：同源校验、蜜罐、Turnstile、落库、通知 |
| `static/images/` / `media/` / `files/` | 40 张图 / 视频 / 目录 PDF |
| `static/_headers` / `_redirects` | Pages 响应头与重定向 |
| `schema.sql` / `.github/workflows/ci.yml` | D1 表结构 / 固定 Hugo 版本的构建校验 |
| `.hugo-version` / `.nvmrc` | 版本锁定单一事实来源 |

---

## 3. 本机环境（已就绪）

| 工具 | 版本 | 位置 |
| --- | --- | --- |
| Hugo **extended** | `v0.170.0` | `C:\Users\Administrator\.local\bin\hugo.exe`，已写入用户级 PATH（**新开终端生效**） |
| Node / npm | `22.22.2` / `10.9.7` | 系统已有 |
| Git | `2.55.0` | 系统已有 |
| Tailwind CSS | v4（+ `@tailwindcss/cli` / typography / forms） | `node_modules/` |
| Wrangler | v4 | `node_modules/.bin/wrangler` |

已执行 `git init`（分支 `master`，尚无提交）。**全局 git 身份未配置**，提交前先执行：

```bash
git config --global user.name  "你的名字"
git config --global user.email "you@example.com"
git branch -M main
```

```bash
npm run dev             # http://localhost:1313，Hugo 单进程同时编译 Tailwind
npm run build           # hugo --gc --minify --cleanDestinationDir
npm run preview         # 生产环境配置预览
npm run functions:dev   # 先构建，再用 wrangler 模拟 Pages + Functions（http://127.0.0.1:8788）
```

---

## 4. GitHub 上线

```bash
git add .
git commit -m "feat: convert laserconsums.com content into Hugo pages"
git branch -M main
git remote add origin https://github.com/<你的用户名>/shopsite.git
git push -u origin main
```

- 仓库可用 `https://repo.new` 新建，**不要**勾选 README / LICENSE 初始化，避免首次 push 冲突。
- `.gitignore` 已排除 `public/`、`resources/_gen/`、`node_modules/`、`hugo_stats.json`、`.dev.vars`、`.wrangler/`。
- `static/`（图片 + 视频 + PDF，约 24 MB）与 `package-lock.json` **必须提交**。
- **绝不要**把备份目录 `D:\SDK\site\网站文件备份\` 里的 `.sql` / `wp-config.php` 复制进仓库：内含 License Key、API 密钥、用户密码 hash 和真实客户询盘（见第 9 节）。
- Actions 固定下载 `.hugo-version` 里的 Hugo extended，跑 `npm ci && npm run build`，检查产物与 Functions 语法。

---

## 5. Cloudflare Pages 配置

Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → 选仓库：

| 配置项 | 值 |
| --- | --- |
| Production branch | `main` |
| Framework preset | `Hugo`（或 None 后手填下面两项） |
| Build command | `npm ci && hugo --gc --minify --cleanDestinationDir` |
| Build output directory | `public` |
| Root directory | `/`（留空） |
| **HUGO_VERSION** | `0.170.0` ← 建议与 `.hugo-version` 一致；**不设也能构建**（见下） |
| **NODE_VERSION** | `22`（`.nvmrc` 也写了 22） |
| `HUGO_ENV` | `production`（可选） |

> 2026-11-18 实测：Cloudflare Pages 在没配 `HUGO_VERSION` 时会用自动探测的 **Hugo 0.147.7**，并且忽略 Dashboard 里填的构建命令、直接跑 `hugo --minify`。原模板里的 `hugo.Data` 是新版语法，0.147 会报 `can't evaluate field Data in type interface {}`。现已全部改成通用的 `site.Data`，并用 0.147.7 本地复现构建通过（19 Pages / 444 static）。因此 `HUGO_VERSION` 不再是硬性要求；但仍建议在 Pages 里设置它，并把 Dashboard 的 Build command 明确写成 `npm ci && hugo --gc --minify --cleanDestinationDir`，避免自动探测带来意外。

> **`baseURL` / sitekey 有两种填法，二选一：**
> ① 直接改 `hugo.toml` 的 `baseURL` 和 `params.turnstileSiteKey` 并提交；
> ② 保持仓库里的 `example.com` / 空 sitekey，改用构建环境变量覆盖：
>
> | 构建环境变量 | 值 | 覆盖的配置 |
> | --- | --- | --- |
> | `HUGO_BASEURL` | `https://你的正式域名/` | `baseURL` |
> | `HUGO_PARAMS_TURNSTILESITEKEY` | `0x4AAAAAAA...` | `params.turnstileSiteKey` |
>
> 已实测 Hugo 0.170 支持这两个变量，生成的 meta/canonical 会跟着变。Production 与 Preview 环境可分别设置，建议 Preview 填 `https://xxx.pages.dev/`，避免预览站的 canonical 指向生产域。sitekey 本身是公开值，放构建变量没问题；Secret Key 仍只放运行时 Secret。变量改后必须重新部署才生效。
>
> Pages 单文件上限 25 MB，`Better-Laser-2025.pdf`（12.4 MB）与视频（5.95 MB）均在范围内；若后续换大目录，改用 R2 + 外链。

---

## 6. 询价链路与表单配置

### 与原站表单的对应关系

原站有两套 Elementor 表单，字段完全一致，本项目用一个端点承接：

| 项目 | 原站（WP） | 本项目 |
| --- | --- | --- |
| 字段 | `name` / `email`(必填) / `message` | 同左 + 蜜罐 `website` + 隐藏 `source` |
| 提交动作 | `save-to-database` + `email` + `redirect` | D1 落库 + 可选邮件 + 303 跳转（等价） |
| 收件人 | 首页 `janjung@betterlaser.tech`；弹窗/广告页 `janjung@betterlaser.com.cn` | `MAIL_TO`（SMTP / Resend / Email Service） |
| 邮件主题 | `老大，激光耗材着陆页底部来询盘了` | `New inquiry from <name>` |
| 自动回复 | `Hi, [name], thank you for inquiring about our product…` | 未启用；需要时在投递层（SMTP 或 Resend）加第二封邮件 |
| 成功跳转 | `https://laserconsums.com/thank-you/` | `/thank-you/` |
| 落地页内容 | 致谢 + WhatsApp 二维码 + `DOWNLOAD CATALOG` | 同左（PDF 与二维码已本地化） |

> 原站管理员邮箱 `jinba225@gmail.com`（`wp_options.admin_email` / WooCommerce 发件人）**不是**表单收件人，未写入任何页面。

### 来源追踪

原站所有 `Get Free Quote` / `Contact US` 都是 Elementor popup 触发，本项目改成指向 `/contact/?ref=<来源>`（产品 slug、hero、faq、footer 等）。`static/js/contact.js` 读取 `ref` 写入隐藏字段 `source`，联系页显示「Regarding: Fiber Laser Protective Lens」。后端把 `source` 写进实时日志、D1（`source` 列）和通知邮件。首页样品表单默认 `source=samples`。

### 邮件网关接入（当前推荐：发信已独立部署）

发信逻辑已拆成独立 Worker **`emailworker`**（见网关项目的 `DEPLOY.md`），本站点只负责把表单 POST 过去，不再依赖 Pages Function 里的 SMTP/Resend。

**本项目要做的（一次性，已完成）**

- 表单 `action` 全部改为 `{{ site.Params.contactEndpoint }}`（`layouts/index.html` 两处、`layouts/contact/single.html` 一处、共享 partial 原本就是该写法）。
- `hugo.toml` 的 `params.contactEndpoint` 默认是 `/api/contact`（本地/无网关时回退到 Pages Function）；**生产在 Pages 构建变量里加 `HUGO_PARAMS_CONTACTENDPOINT`，值为网关表单地址**，无需改仓库：

```
HUGO_PARAMS_CONTACTENDPOINT = https://emailworker.<账号>.workers.dev/f/contact
```

- `static/js/origin.js` / `contact.js`：只发 `Accept: application/json`（已去掉网关 CORS 不允许的 `X-Requested-With`）；错误提示兼容网关的 `{error:{code,message}}`；成功仍跳 `/thank-you/`。字段名 `name/email/message`（联系页为 `phone`）、蜜罐 `website`、`source` 均与网关默认配置兼容。

**网关侧必须配的（在网关项目做，见其 DEPLOY.md）**

1. 写入 FORMS KV 的 `form:contact` 配置，`allowedOrigins` 含本站点 origin（`https://` + 域名 + 端口），否则 403。
2. 网关 `wrangler.toml` 的 `CORS_ALLOWED_ORIGINS` 也要含本站点 origin——JS `fetch` 跨域提交时浏览器要读响应，两处域名都要配，改完需重新部署网关。
3. 网关 Secret 配 SMTP（或 `SMTP_CONFIG`）；如需人机验证，网关配 `TURNSTILE_SECRET_KEY` 且表单配置开 `turnstile`，本站点 `hugo.toml` 的 `turnstileSiteKey` 填同一个 Site Key。
4. 想让**无 JS** 的原生表单提交后也跳感谢页，表单配置里设 `successRedirect` 为 `https://你的域名/thank-you/`。

**验证**：浏览器提交表单 → 跳 `/thank-you/`；网关日志 `npx wrangler tail emailworker` 出现 `form.sent`。失败排查：`?error=origin_not_allowed` → 上面第 1、2 步域名没配对；`?error=form_not_found` → action 与 KV key 不一致；`?error=smtp_send_failed` → 网关 SMTP 配置。

> 旧的 Pages Function `functions/api/contact.js` 保留作本地/回退通道，配了 `HUGO_PARAMS_CONTACTENDPOINT` 后表单不再走它。下面 A–D 节的 SMTP/Resend 配置只对这条回退通道有效。

### A. 最小可跑（回退通道：Pages Function）

`.dev.vars` 已设 `SKIP_TURNSTILE=1`，本地 `npm run functions:dev` 可直接提交：

```bash
curl -i -X POST http://127.0.0.1:8788/api/contact \
  -H 'Accept: application/json' \
  -d 'name=Test&email=me@example.com&message=hello&source=hero'
# → 200 {"ok":true}
curl -i -X POST http://127.0.0.1:8788/api/contact -d 'name=Test&email=me@example.com&message=hello'
# → 303 Location: /thank-you/（原生表单路径）
```

### B. 生产必做：Turnstile

1. Dashboard → **Turnstile → Add widget**，域名填 `xxx.pages.dev` 与自定义域，Mode 选 Managed。
2. **Sitekey**（公开）→ `hugo.toml` 的 `params.turnstileSiteKey`，重新构建后 widget 才会渲染。
3. **Secret Key** → Pages Settings → Environment variables → `TURNSTILE_SECRET_KEY`（Secret）。
4. 生产**不要**设 `SKIP_TURNSTILE`。

### C. 可选：落库与通知

| 能力 | 配置 | 说明 |
| --- | --- | --- |
| D1 落库 | `npx wrangler d1 create shopsite-forms` → `npx wrangler d1 execute shopsite-forms --file=./schema.sql` → Functions → D1 bindings，变量名 **`DB`** | 写入失败返回 500，不丢线索 |
| **SMTP（自有域名邮箱）** | Vars `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_SECURE`，Secret `SMTP_PASS`；加 `MAIL_FROM` / `MAIL_TO` | 直连你的邮件服务器（`cloudflare:sockets`），发件人必须是该账号本人地址 |
| Resend 邮件 | Secret `RESEND_API_KEY`；Vars `MAIL_FROM` / `MAIL_TO` | `reply_to` 为访客邮箱，可直接回复 |
| Cloudflare Email Service | 绑定 `EMAIL`（`send_email`）+ `MAIL_FROM` / `MAIL_TO` | 免费档只能发到账号内已验证地址 |
| 都不配 | 无需配置 | 结构化记录进入 Pages Functions 实时日志 |

发信优先级：**Resend → SMTP → Email Service**，配了哪个走哪个；全部失败只写日志，询盘仍返回 200。

### D. SMTP 具体填什么

| 变量 | 示例 | 说明 |
| --- | --- | --- |
| `SMTP_HOST` | `smtp.exmail.qq.com` | 服务商的发信服务器，别填收信（IMAP）地址 |
| `SMTP_PORT` | `465` | 465 配 `SMTP_SECURE=ssl`；587 配 `starttls`。**25 端口 Cloudflare 全平台封锁** |
| `SMTP_SECURE` | `ssl` | `ssl` / `starttls` / `none`（`none` 仅本地自测） |
| `SMTP_USER` | `forms@yourdomain.com` | 完整邮箱地址，不是用户名 |
| `SMTP_PASS` | — | 密码口径随服务商不同，见下表：**默认填邮箱登录密码，只有开启「授权码 / 安全密码」的账号才填生成的码** |
| `MAIL_FROM` | `Laser Consumables <forms@yourdomain.com>` | 必须与 `SMTP_USER` 同域，否则多数服务器拒发 |
| `MAIL_TO` | `sales@yourdomain.com` | 收件人，多个用逗号分隔 |

各家的 `SMTP_HOST` 与密码口径（`SMTP_SECURE` 一律 `ssl`）：

| 服务商 | `SMTP_HOST` | 端口 | `SMTP_PASS` 填什么 |
| --- | --- | --- | --- |
| **阿里企业邮箱** | `smtp.qiye.aliyun.com` | 465 | **默认就是邮箱登录密码**；若后台开了「三方客户端安全密码」，改填生成的 16 位密码 |
| 阿里个人邮箱 `@aliyun.com` | `smtp.aliyun.com` | 465 | 同上 |
| 腾讯企业邮 | `smtp.exmail.qq.com` | 465 | 客户端专用密码（后台生成） |
| QQ / 163 | `smtp.qq.com` / `smtp.163.com` | 465 | 授权码（不是登录密码） |
| Google Workspace | `smtp.gmail.com` | 465 | 应用专用密码（需先开两步验证） |

> **阿里邮箱的坑：只认 `AUTH PLAIN`**。同一账号同一密码，`AUTH LOGIN` 返回 `526 Authentication failure`，`AUTH PLAIN` 返回 `235 Authentication successful`。`functions/api/contact.js` 因此**先试 PLAIN、失败再回落 LOGIN**，不要把这个顺序改回去。
>
> 另需满足：① 邮箱后台允许「三方客户端登录」；② 账号开放了 SMTP 服务协议；③ **587 端口阿里未开通**，只能 465 + `ssl`。
>
> **报错对照**（`wrangler pages dev` 终端里的 `[contact] notify failed`）：
>
> | 报错 | 含义 | 处理 |
> | --- | --- | --- |
> | `526 Authentication failure` | 阿里：账号或密码不被接受 | 先拿同一密码测 IMAP 993 登录；IMAP 也失败说明是凭证问题（密码错 / 需要「三方客户端安全密码」/ 后台禁用了三方客户端），不是代码问题 |
> | `535 authentication failed` | 腾讯 / 163：授权码没开或填成了登录密码 | 后台生成专用密码 |
> | `550 / 553 sender rejected` | 发件人地址不属于该账号 | `MAIL_FROM` 的地址必须与 `SMTP_USER` 一致 |
> | `ECONNREFUSED` / 超时 | 端口被封或填了 25 / 587 | 改 465 + `ssl` |
> | `certificate` 相关 | 套了自定义域名的 SSL 端口但没上传证书 | 换回服务商官方 host |
>
> 本地联调可指向 `D:/tmp/smtp_sink.py` 起的假服务器（`127.0.0.1:2525` + `SMTP_SECURE=none`），不消耗真实额度也不怕密码泄露。

---

## 7. 验证清单

- [ ] `npm run build` 无 ERROR，Hugo 报告 **19 Pages / 48 static files**；产物含 16 个 HTML（含 `/thank-you/`、`/thanks/` alias、`404.html`）、40 张图片、视频、PDF，CSS 57.9 KB
- [ ] 所有 `/images/…`、`/media/…`、`/files/…`、`/js/…` 引用都能在 `public/` 找到对应文件（已核验 46 个引用、0 缺失、40 张图全部被使用）
- [ ] 首页 `#custom` 拖动对比：手柄可拖拽、点击/触摸可移动、键盘 ←/→/Home/End 可用、hover 显示 Before/After 标签
- [ ] 局域网预览 `npx wrangler pages dev public --port 8788 --ip 0.0.0.0` 可用（防火墙已放行 `workerd.exe`）
- [ ] `node --check functions/api/contact.js` 通过
- [ ] `npm run functions:dev`：`GET /api/contact` → **405**，POST → 200 / **303 `/thank-you/`**，日志带 `source`
- [ ] `/`、`/products/`、8 个详情页、`/about/`、`/faq/`、`/contact/`、`/thank-you/`、`/404.html` 均可访问
- [ ] 首页两个表单（样品区 / 联系页）分别提交均跳 `/thank-you/`，PDF 可下载、二维码可见
- [ ] GitHub Actions 全绿；Pages 首次部署成功
- [ ] 线上填一次真实表单：Turnstile 出现、D1 有记录或收到邮件
- [ ] 自定义域 + HTTPS 生效；`_headers` 响应头在 DevTools 中确认

---

## 8. 原站数据的已知问题（原样保留，待业务确认）

转换以**忠实还原**为原则，以下内容未擅自改写，但明显需要业务侧核实：

1. **CO2 Protective Lens 的 Wavelength 写成 `1060-1080nm`**，而副标题是 `For 10.6μm lasers` —— 数据库 `#680` 里确实如此，属原站复制粘贴错误。
2. **MOQ 冲突**：Hero 写 `MOQ: 50 pcs`，FAQ 写 `The MOQ is as low as 10 pieces`，两处原文均如此。
3. **3 个产品卡标题都是 `Laser Cutting Nozzles`**（参数完全相同、图片不同）。保留原标题，仅加 `Type 01/02/03` 区分 URL 与详情页。
4. 材质 `Zense`、`< 5 A RMS`（应为 `Å`）、`processing , I can`（多余空格）均按原文保留。
5. Thank You 页原文写 `add my whatsapp or wechat`，但配图只有一个 **WhatsApp 二维码（Janjung）**，没有微信码。
6. 原站 Footer / Header 主题模板与 Contact、About Us、Terms & Privacy、Help & Info 等页面仍是**演示模板占位文案**（`contact@mysite.com`、`123-456-7890`、`11 Pine St, Northeast Harbor`），未作为真实信息迁移。

改文案只需编辑 `data/*.yaml`，模板无需改动。

---

## 9. 与 WordPress 备份的比对结论

备份路径：`D:\SDK\site\网站文件备份\domains\laserconsums.com`
- `u595882749_rNqbj.20261014062831.sql`（101 MB，MariaDB dump，2026-10-14）
- `public_html/`（WordPress 6.x + Elementor Pro 4.2.0 + WooCommerce 11.1.0 + WPForms + SEOPress）
- `wp-content/uploads/` 416 个文件 / 44 MB（186 个原始媒体，其中 2025/11 有 108、2025/12 有 71；2026 各月目录为空）

### 权威内容定位

| 项 | 值 |
| --- | --- |
| `show_on_front` / `page_on_front` | `page` / **#680 `home-old`**（不是 `laserlens`） |
| 首页 Elementor 数据 | `wp_postmeta._elementor_data` for #680，154 KB JSON / 259 个节点 |
| `blogname` / `blogdescription` | `Laser Consumables-Better Laser` / `Laser Consumables Manufacturer` |
| 主题 / Elementor | `hello-elementor` / Elementor 4.2.0 + Pro 4.2.0 |
| 主题构建器条件 | Header #932、Footer #914 全站；Popup #901 排除 `/thank-you/` 页 |
| 表单 | 首页 #680、弹窗 #901、广告页 #149/#898 各一套，字段一致 |

### 本次比对后已修正

| 差异 | 处理 |
| --- | --- |
| 首页缺少 Hero 背景视频 `laserprocessvideo.mp4` | 本地化 + `<video autoplay muted loop playsinline>`，封面沿用 `banner底.jpg` |
| 整个底部「Want to find the source factory…」版块遗漏 | 新增 `/#factory` |
| 整个「Get Samples Now !」+ 页面内嵌表单遗漏 | 新增 `/#contact`，表单与联系页共用组件 |
| 全站弹窗 #901 文案遗漏 | 先静态化为版块，随后按原站行为恢复为延迟浮层（`quote-popup.html` + `popup.js`），首页不再多出常驻版块 |
| `/thank-you/` 页只搬了个占位致谢，缺目录 PDF / WhatsApp 二维码 / Janjung | 按 #549 原文重建，PDF 与二维码本地化 |
| 优势区 7 张工艺实拍只用了 3 张 | 按 #680 还原为 3 行「左文 + 右双图」，`advantage-1` 用作对比组件 After 图，40 张本地图片全部被引用 |
| 成功跳转 `/thanks/` 与原站 `/thank-you/` 不一致 | 后端 303、JS、`_redirects`、Hugo alias 全部改为 `/thank-you/` |
| 模板里有多处自创英文（Hero 副标题、各区副标题、Final CTA 等） | 全部替换为 `data/sections.yaml` 中的原文 |
| 导航顺序 / 按钮文案与原站不符，缺 Contact | 按 #680 的 7 项 icon-list 顺序还原，按钮改 `Quick Quote Now !` |
| `title` 与 WP `blogname` 不符 | 改为 `Laser Consumables-Better Laser` |
| 表单字段占位符、标签被本地化改写 | 改回原站 `Name` / `Email` / `Message` |
| FAQ 第 3 条 `1″` 弯引号、About `processing ,` 空格 | 改回原文字符 |
| favicon 用的是 logo 图标 | 换用备份里的 `cropped-logo.png` |

### 按原站容器树重排 + 恢复拖动对比（2026-11-16 追加）

从 `_elementor_data` 解析出 #680 的 container 层级与列宽，逐页对齐，去掉此前自创的栅格与版块：

| 版块 / 页面 | 原站结构 | 本项目调整 |
| --- | --- | --- |
| Hero /1 | 左列文字（2 heading + icon-list + button）、右空列，整段背景视频 | 3 条卖点回到左列，去掉右侧自创卡片与次按钮 |
| Trust /2 | 3 × 33%，第 3 列 `#FF6347` 橙底 | 第三列改橙底白字 |
| 痛点 /3 | 标题居中，每列 icon-box 在上、图片在下 | 图/文顺序与居中标题还原 |
| 产品 /4 | 居中标题 + 4 列 × 2 行；卡内 标题→图→全部规格→单一 CTA | 去掉 Details 按钮与 `View full catalog`，规格由 3 条改为全 5 条 |
| 定制 /5 | 左 50% 文案 / 右 50% `elementskit-image-comparison` | **恢复拖动对比**（见下） |
| 优势 /6 | 3 行「左标题+说明 / 右两张工艺图」，图标位置 right/left/right 交替 | 去掉 3 列卡片 + 4 图图墙，改回 3 行双图 |
| Why /7 | 左 50% 文案 / 右 50% masonry 2 列 4 图 | 补回 `why-team.avif` 等 4 张 |
| Partners /8 | 8 logo 一行、无边框卡片 | 改 `lg:grid-cols-8` |
| About /9 + /10 | 左大图右正文 → 3 图横排 → 25%/75% 创始人卡片 | 首页与 `/about/` 同版式 |
| FAQ /11 | 左 35% 标题 / 右 65% toggle | 首页与 `/faq/` 同版式 |
| 底部 /12 | 背景图 + 左 50% 文案/logo/divider + 右 50% 白色表单卡片 | 把原来分离的 3 个版块合并回去 |
| Header #932 / Footer #914 | logo 5% + 右导航 95% / 5 列 + 居中版权条 | 同步还原，去掉自创菜单项 |
| 独立页面 | 原站无独立页 | `/products/`、8 个详情页、`/contact/`、`/thank-you/` 全部沿用上述组件版式；`baseof.html` 不再用 `max-w-5xl` 限制通栏 |

**Before/After 拖动对比（原站 `.twentytwenty-overlay`）**：备份 #680 /5/1/0 是 ElementsKit `elementskit-image-comparison` widget（`horizontal`、默认 50%、标签 `Before` / `After`），两张图分别是尺寸工程图 `CleanShot-…@2x.png` 与成品镜片 `Frame-16.png`。此前版本只渲染了工程图单图，交互丢失。现直接使用备份中的原版 `jquery.twentytwenty.js` + `jquery.event.move.js`，DOM、CSS、参数都取自原站渲染结果（详见第 12 节的像素级复刻方案）：白色圆形手柄、上下分隔线、黑色左右箭头、hover 遮罩与 Before/After 标签、拖动中隐藏遮罩，行为与线上一致；支持鼠标拖动与键盘（←/→、PgUp/PgDn、Home/End，`aria-valuenow`）。参数仍在 `data/custom.yaml` 的 `compare` 中可查，运行时初始化在 `static/js/origin.js`。

### 明确未迁移（及原因）

| 备份内容 | 决定 |
| --- | --- |
| 15 个 WooCommerce `product-name-*` 产品 | 全部是 `Product Name` 模板占位（无价格/描述），不迁移；真实产品是首页 8 个卡片 |
| `terms-privacy` / `help-info` / `contact` / `about-us` / `home-2` / `sale-page` 等 15 个 page | 内容全是演示模板占位文案，且已由 `/about/`、`/faq/`、`/contact/` 覆盖 |
| Header #932 的 search form + WooCommerce mini cart、Footer #914 的 newsletter | 电商未启用，静态站无搜索/购物车后端；未迁移 |
| `#149 laserlens`（标题 `Professional Laser Lens Manufacturer In China`）、`#898 广告投放页`、`#680 home-old` 的多份 revision | 是首页的广告/历史变体，仅标题与收件邮箱不同，不另建重复页面 |
| `wp_e_submissions` 123 条真实询盘 + `wp_users` / 密钥 | **不迁移**：属业务数据与凭据，见下方安全提示 |
| `#941 global-styles`、Elementor kit / fonts / 模板截图 | 纯编辑器资产，与前台无关 |

### ⚠️ 安全提示

SQL 导出里含有 **Elementor Pro License Key、`elementor_one_client_secret`、`wp_mail_smtp_mail_key`、用户密码 hash、管理员邮箱、123 条含真实邮箱的询盘记录**，`wp-config.php` 里还有数据库账号密码。这些文件留在备份目录即可，**不要**复制进 Hugo 项目、不要提交到 Git、不要作为静态资源发布。本项目 `static/` 只包含前台需要的图片、视频和 PDF。

### 仍需你确认

1. `MAIL_TO` 用哪个收件地址：`janjung@betterlaser.tech`（首页）还是 `janjung@betterlaser.com.cn`（弹窗/广告页），或统一到一个新地址。
2. 是否需要恢复给访客的**自动回复邮件**（原站模板已记录在 `functions/api/contact.js` 顶部注释）。
3. ~~全站弹窗形态~~ **已处理**：首页弹窗按原站 #901 还原为**居中模态框**（640px、两列各 50%、深色遮罩、右上角关闭），12 秒出现、可关闭、30 天记忆，`/thank-you/` 不显示。控制逻辑在 `static/js/origin.js`。
4. 第 8 节列出的原文数值错误（CO2 波长、MOQ、重复产品名）是否修正。

---

## 10. 容易踩的坑

1. **版本漂移**：本地 Hugo 与 Pages 的 `HUGO_VERSION` 必须一致，升级时同步改 `.hugo-version` 与 Pages 环境变量。
2. **Tailwind 只认完整字面量**：不要拼接 `"text-" + color`；新增 class 后 `cachebusters` 会触发 CSS 重编译。
3. **hugo_stats.json 被 .gitignore 屏蔽**：`main.css` 必须保留 `@source "hugo_stats.json"`，`baseof.html` 必须用 `templates.Defer` 延迟编译。
4. **图片扩展名**：从加速站点抓下来的 `.jpg` 可能是 WebP，上传前务必按真实字节改扩展名。
5. **`_redirects` 别碰 `/api/*`**：写了会抢走 Functions 的 POST 路由。
6. **Turnstile 必须服务端复核**：只放 widget 等于没防护。
7. **`enableGitInfo = false`**：空仓库无 commit 时设 true 会让 Hugo 直接构建失败。
8. **Markdown 里不能写 Go 模板 / 裸 HTML**：`goldmark.renderer.unsafe = false`，需要动态数据就用 shortcode 或独立 layout。
9. **Hugo 0.170 适配**：`languageCode` → `locale`、`.Site.Data` → `hugo.Data`。
10. **Pages vs Workers**：Cloudflare 2025-04 起新特性集中在 Workers + static assets，但 Pages 仍可用且自定义域不要求 DNS 迁入 Cloudflare。

---

## 11. 还需要你补的凭据

上线时按第 4 / 5 / 6 节填入：GitHub 仓库地址、Cloudflare 账号、Turnstile Sitekey + Secret Key、`baseURL` / 自定义域名、（可选）SMTP 账号或 Resend API Key、D1 数据库 ID；并按第 8 / 9 节确认原站文案与表单收件人。

---

## 12. 像素级复刻（最新实现，与前文冲突处以本节为准）

用户要求「文字内容、字体大小颜色风格、页面布局，像素级复刻」。此前用 Tailwind 近似还原的版本已废弃为主页实现，改为**以原站真实渲染结果为基准静态化**：带浏览器 UA 抓取线上首页完整 HTML（Cloudflare 挑战可绕过），把 head 中 83 段内联 critical CSS 与 63 个外链 CSS（从备份 `wp-content/cache/seraphinite-accelerator/s/m/d/css/` 取全）合并，配合 WordPress 备份里的 `uploads/` 原图、自托管字体与插件 JS，生成静态 Hugo 模板。这样字号（H1 = 63px）、字体（标题 Raleway / 正文 Inter）、颜色（`#FF6347` / `#222334` / `#616379`）、列宽、padding、背景图全部由原站 CSS 决定，不再靠猜测。

### 文件与职责

| 文件 | 内容 |
| --- | --- |
| `layouts/index.html` | 独立完整 HTML 文档（不走 `baseof.html`）：原站 #680 的 13 个顶层容器 + #901 弹窗 + WhatsApp 按钮 |
| `layouts/contact/single.html` | 原站 Header #932 + 主内容 #965 + Footer #914 |
| `layouts/thankyou/single.html` | 原站 #549 致谢页（含目录 PDF 下载与 WhatsApp 二维码） |
| `static/css/origin.css` | 首页全套原站 CSS（内联 critical + 63 个外链，977 KB，URL 全部本地化） |
| `static/css/origin-{contact,thankyou}.css` | 两页相对首页的 CSS 增量（含 #932/#914/#965/#549 的逐元素规则） |
| `static/css/origin-extra.css` | 运行时胶水：Elementor Pro 弹窗模态壳、关闭按钮、表单状态、`[hidden]` |
| `static/css/origin-fonts.css` | 617 个 `@font-face`，供自建内页复用原站字体 |
| `static/js/origin.js` | twentytwenty 原版初始化 + FAQ 折叠 + 弹窗 + 表单提交 + Turnstile + 右下角 WhatsApp 链接注入 |
| `static/js/vendor/*` | 备份中的 jQuery 3.7.1、`jquery.event.move.js`、`jquery.twentytwenty.js` |
| `static/js/back-to-top.js` | 全站返回顶部按钮：自注入样式与 DOM，静态化页与 Tailwind 自建页共用 |
| `static/images/origin/`、`static/fonts/`、`static/wp-assets/` | 原图 51 张、Google Fonts 311 个 woff2、插件图标字体等 |

### 页面覆盖

- **1:1 静态化**：`/`（#680）、`/contact/`（#965 + 全站 Header/Footer）、`/thank-you/`（#549）。文字内容清洗前后逐片段比对 **165/165 完全一致**，未增删任何原站文案。
- **原站不存在的自建页**（`/products/`、8 个产品详情、`/about/`、`/faq/`、`/404`）：保留 Hugo/Tailwind 结构，但通过 `origin-fonts.css` 换用原站字体、标题 42px Raleway、橙红直角大写按钮，风格与首页统一；不再输出旧的自制弹窗卡片。
- **表单**：原站 Elementor 表单 DOM 保留，字段改接 `POST /api/contact`（首页 `name/email/message`，联系页 `name/email/phone`），蜜罐 + `source` + 可选 Turnstile 不变；成功跳 `/thank-you/`。联系页的 Phone 字段由后端转成 `Phone: …` 作为消息内容。
- **拖动对比**：直接跑原站 jQuery 插件，`#680` 的 `data-offset=0.5` / Before / After 标签原样生效。

### 验证结果（1440×900 Chrome headless）

| 项目 | 结果 |
| --- | --- |
| 首屏 vs 原站基准截图 | 平均通道差 < 1，差异像素 **0.86%**（差异来自基准页缺失的图标字体/WhatsApp 按钮，本版本更完整） |
| 全页 | 高 9170px、13 个顶层版块、35 张图片 0 损坏；痛点/产品/优势/Why/About/FAQ/底部 CTA 全部逐段核对 |
| 交互 | FAQ 展开/收起 ✓；twentytwenty 拖动 50% → 20%（`aria-valuenow=20`）✓；弹窗开关 ✓；390px 移动端 ✓ |
| 表单 | 联系页填写 → `/api/contact` → `200` → 跳 `/thank-you/` ✓ |
| 构建 / 资源 | `19 Pages / 441 static files`；2688 个本地引用 **0 缺失**；`node --check` 全部通过 |

### 注意事项

1. **CSS 体积较大**（首页 ~977 KB、内页再加载增量 CSS）：这是原站 Elementor 全量样式的原样保留，换取自托管后浏览器可长期缓存；如需瘦身，可只保留用到的 widget CSS 与 latin 字体子集。
2. 三个静态化页面是**完整 HTML 文档**，不经过 `baseof.html`，因此不会加载 Tailwind、旧 `header/footer` partial 与 `contact.js`/`compare.js`；`quote-popup.html` 与 `popup.js` 仅作为历史实现保留。
3. 生成脚本在 `D:/tmp/build_origin.py`、`D:/tmp/build_inner.py`（一次性工具，不在项目内）。若原站改版需重跑，否则**直接编辑 `layouts/*.html` 即可**，改完 `npm run build` 生效。
4. 本地构建需 `hugo` 在 PATH（本机在 `C:\Users\Administrator\.local\bin`）；CI/Pages 侧仍按第 4 节的 `HUGO_VERSION` 锁定 `0.170.0`。
5. `contact-hero-img.jpg` 在原站备份里本身就是一张「图片加载失败」占位图（浅灰底 + 破图图标），复刻后显示一致，不是本项目资源丢失。
6. 原站 footer 的 `home-2 / shop-2 / about-us / terms-privacy` 等模板 demo 链接已改指首页，避免死链；Cloudflare 邮件混淆端点改为 `#`。
7. **右下角 WhatsApp 按钮**：原站由 Click-to-Chat（HoliThemes）插件在运行时读取 `.ht_ctc_chat_data` 的号码 `601123342407`，拼出 `https://wa.me/601123342407` 并 `_blank` 打开；按钮本身只是一个 `<img>`，没有 `<a>`。静态化未引入该插件 JS，故由 `origin.js` 在三个静态化页面上注入一层透明的真实 `<a>`（`target=_blank` + `noopener noreferrer`），不改 DOM 布局。自建页 `/products/`、`/about/`、`/faq/` 不走 `origin.js`，目前没有该浮动按钮。
8. **返回顶部按钮**：`static/js/back-to-top.js` 自注入样式与 `<button>`（46px 圆形、`#ff6347`、白色箭头），滚动阈值 `min(400px, 可滚动距离 × 0.5)`，因此 `/thank-you/` 这类只能滚 116px 的短页也能触发；页面有 WhatsApp 按钮时 `bottom:81px` 避让，没有则 `bottom:15px`。三个静态化模板与 `baseof.html` 均已引入，`build_origin.py` / `build_inner.py` 的模板字符串也已同步，重跑生成脚本不会丢。

>>>>>>> 22a9d2e (init)
