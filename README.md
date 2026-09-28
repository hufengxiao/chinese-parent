# 中国式家长 H5 (Chinese Parents H5)

个人自娱自乐项目：深度复刻《中国式家长》核心玩法的纯前端 H5 养成游戏。  
在线体验地址: https://chinese-parent.pages.dev/

---

## 策划与系统设计文档
- **系统总览主案**：见 [GAME-DESIGN.md](./GAME-DESIGN.md)
- **详尽系统设计文档库**：见 [docs/README.md](./docs/README.md)（已对所有 15 个核心章节与机制进行了全量详尽扩充）
- **完整设计大典总集篇**：见 [docs/GAME-DESIGN-FULL.md](./docs/GAME-DESIGN-FULL.md)

---

## 技术架构
- 技术选型：原生 HTML5 / CSS3 / ES 原生模块 JavaScript，零第三方库依赖
- 存档存储：`localStorage` 双级持久化（单代进度 + 家族档案）
- 部署分发：Cloudflare Pages 静态边缘网络自动化集成与全球加速