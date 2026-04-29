# Meme Hub

一个纯静态 Meme 图片分享站，支持中文文件名展示和中文模糊搜索。适合直接部署到 GitHub Pages。

## 目录结构

```text
.
├── index.html
├── styles.css
├── app.js
├── meme-manifest.json
├── pictures/
└── scripts/
    └── generate-manifest.mjs
```

## 添加图片

1. 把图片放到 `pictures/`。
2. 在项目根目录运行：

```bash
node scripts/generate-manifest.mjs
```

3. 提交更新后的图片和 `meme-manifest.json`。

支持扩展名：`.jpg`、`.jpeg`、`.png`、`.gif`、`.webp`、`.avif`、`.svg`、`.bmp`。

## 本地预览

直接打开 `index.html` 通常也可以，但更推荐用静态服务器预览：

```bash
python -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 部署到 GitHub Pages

1. 新建公开 GitHub 仓库。
2. 将本文件夹内容推送到仓库默认分支。
3. 在仓库 `Settings -> Pages` 中选择 `Deploy from a branch`。
4. Branch 选择默认分支，目录选择 `/root`。
5. 保存后等待 Pages 构建完成。
