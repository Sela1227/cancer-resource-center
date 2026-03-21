# 彰濱癌症中心 - 癌症資源中心管理系統

管理營養物資、假髮租借、活動記錄、個案及轉介的整合系統。

**當前版本：V1.0**

## ⚠️ 重要警告

1. **資料存在瀏覽器**：清除瀏覽器資料會遺失所有資料！
2. **iOS 7 天清除**：iOS Safari 會在 7 天未使用後自動清除網站資料
3. **必須定期備份**：點選首頁備份按鈕，將備份檔儲存到 iCloud / Google Drive / 電腦

---

## 📋 版本歷史

### V1.0 (2026-03-21)
- 初始版本
- 營養物資管理（庫存、發放記錄、一鍵生成 LINE 公告）
- 假髮管理（庫存、基金會申請、租借、歸還、報廢）
- 活動記錄（小學堂、衛教）
- 個案管理（資源使用整合檢視）
- 轉介管理（營養師、社工師、心理師）
- 資料備份與匯入

---

## 🚀 使用方式

### 方式一：使用 npm（推薦）

```bash
cd /path/to/cancer-resource-center
npm install
npm run dev
```

### 方式二：使用 Python 簡易伺服器

```bash
cd dist && python3 -m http.server 8080
# 開啟 http://localhost:8080
```

## 📱 手機測試

1. 確保手機和電腦在同一個 WiFi
2. 執行 `npm run dev -- --host`
3. 在手機瀏覽器輸入終端機顯示的區網網址

---

## 📦 專案結構

```
cancer-resource-center/
├── dist/                # 建置輸出（部署用）
├── public/
│   ├── logo.jpg         # SELA Logo
│   └── manifest.json    # PWA 設定
├── src/
│   ├── components/      # 共用元件
│   ├── pages/           # 頁面
│   ├── services/        # IndexedDB 服務層
│   ├── types/           # TypeScript 型別
│   ├── utils.ts         # 工具函數
│   └── version.ts       # 版本資訊
├── package.json
└── README.md
```

---

## 📄 授權

© 2026 SELA - 彰濱癌症中心
