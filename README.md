# 英語学習モチベーション調査システム

土浦日本大学中等教育学校の生徒を対象とした、月次英語学習モチベーション調査のためのWebアプリケーション。

## 概要

生徒がスマートフォンやPCから簡単に回答でき、Google Spreadsheetに自動記録される。

### 主な機能

- **プルダウン式の氏名選択** - 登録済みの生徒名から選択
- **過去のモチベーション推移グラフ** - スプレッドシートから自動取得
- **月選択** - 4月〜翌年3月の12ヶ月分
- **モチベーション評価** - -2〜+2の5段階評価
- **自由記述** - モチベーション変動の要因を記録
- **レスポンシブ対応** - スマホ・タブレット・PC対応

## システムアーキテクチャ

```mermaid
flowchart TB
    subgraph Frontend["フロントエンド"]
        HTML["index.html<br/>フォームUI"]
        CSS["style.css<br/>スタイリング"]
        JS["script.js<br/>ロジック"]
    end

    subgraph Hosting["ホスティング"]
        GHP["GitHub Pages<br/>/ Vercel / Netlify"]
    end

    subgraph GAS["Google Apps Script"]
        doGet["doGet()<br/>生徒名一覧取得"]
        doPost["doPost()<br/>データ記録"]
    end

    subgraph Spreadsheet["Google Spreadsheet"]
        MainSheet["メインシート<br/>・生徒情報 (A-H列)<br/>・モチベ値 (I-T列)<br/>・記述 (U-AF列)"]
    end

    subgraph User["ユーザー"]
        Student["生徒<br/>(スマホ/PC)"]
    end

    Student -->|"1. アクセス"| GHP
    GHP -->|"2. HTML/CSS/JS配信"| Student
    JS -->|"3. JSONP: 生徒名取得"| doGet
    doGet -->|"4. D列読み取り"| MainSheet
    MainSheet -->|"5. 生徒名一覧"| doGet
    doGet -->|"6. JSON返却"| JS
    JS -->|"7. POST: 回答送信"| doPost
    doPost -->|"8. 該当セルに書き込み"| MainSheet

```

## ファイル構成

```
📁 AutoEmbedder/
├── 📄 index.html      # フォームUI
├── 📄 style.css       # スタイルシート
├── 📄 script.js       # フロントエンドロジック
├── 📄 README.md       # このファイル
└── 📁 gas/
    └── 📄 Code.gs     # Google Apps Script
```

## スプレッドシート列構成

| 列 | 内容 |
|----|------|
| A | 入試方式 |
| B | クラス |
| C | 出席番号 |
| D | 氏名 |
| E | 文理 |
| F | 英語クラス |
| G | 研究参加の可否 |
| H | インタビュー参加の可否 |
| I〜T | モチベーション値(4月〜3月) |
| U〜AF | 変動要因の記述 (4月〜3月) |

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | HTML5, CSS3, Vanilla JavaScript |
| バックエンド | Google Apps Script |
| データベース | Google Spreadsheet |
| 通信 | JSONP (GET), Fetch API (POST) |
| ホスティング | GitHub Pages |

## セットアップ

### 1. Google Spreadsheet

既存のExcelファイルをGoogle Spreadsheetにインポートし、D列に生徒の氏名が入っていることを確認。

### 2. Google Apps Script

1. スプレッドシートで「拡張機能」→「Apps Script」を開く
2. `gas/Code.gs` の内容をコピー＆ペースト
3. `SPREADSHEET_ID` と `MAIN_SHEET_NAME` を設定
4. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」
5. アクセス権限を「全員」に設定
6. デプロイURLをコピー

### 3. フロントエンド

`script.js` の `GAS_URL` にデプロイURLを設定。

### 4. 公開

適当な場所にデプロイ。

## ライセンス

Copyright © 2025-2026 鈴木絵美理 All Rights Reserved.


