# INIAD Linked Role

## これは何？

Discord 上で INIAD 生であるかの認証を行う Bot です。

Discord の[連携ロール](https://support.discord.com/hc/ja/articles/10388356626711-%E6%8E%A5%E7%B6%9A-%E9%80%A3%E6%90%BA%E3%83%AD%E3%83%BC%E3%83%AB-%E7%AE%A1%E7%90%86%E8%80%85)を用いて提供されます。

## 使い方

1. Discord の開発者ポータルからアプリを作成し、Bot をサーバーに招待する。その際に、`client_id`、`client_secret`、`token`を控え、`redirect_uri`を`http://localhost:8787/api/auth/discord/callback`に設定する。
2. Google の API を有効化し、OAuth 2.0 クライアント ID を作成する。その際に、`client_id`、`client_secret`を控え、`redirect_uri`を`http://localhost:8787/api/auth/google/callback`に設定する。
3. このリポジトリをクローンし、`.dev.vars`ファイルを作成し、`.dev.vars.sample`を参考に設定する。
4. `npm install`を実行する。
5. `npm run migrate:local`を実行する。
6. `npm run register`を実行する。
7. `npm run dev`を実行する。

## ライセンス

MIT
