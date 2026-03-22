# 彰濱癌症中心 - 癌症資源中心管理系統

管理營養物資、假髮租借、活動記錄、個案及轉介的整合系統。

**當前版本：V1.3**

## ⚠️ 重要警告

1. **資料存在瀏覽器**：清除瀏覽器資料會遺失所有資料！
2. **iOS 7 天清除**：iOS Safari 會在 7 天未使用後自動清除網站資料
3. **必須定期備份**：點選首頁備份按鈕，儲存到 iCloud / Google Drive / 電腦

---

## 📋 版本歷史

### V1.3 (2026-03-22)
- 版本號顯示於設定頁底部，含完整版本歷史
- 假髮移除租金，只保留押金
- 租借自動產生押金收入記錄

### V1.2 (2026-03-21)
- 假髮改為短/中/長庫存量管理，不再個別編號
- 假髮新增帳目現金流（收入/支出/結餘）
- 轉介新增「基金會」類型
- 「活動」Tab 改為「報表」，包含活動記錄＋統計報表
- 統計報表：癌別分布、物資發放、假髮帳目、活動人次、轉介完成率
- 設定頁新增假髮帳目起始金額

### V1.1 (2026-03-21)
- 新增管理設定頁面（首頁右上角齒輪圖示）
- 物資品項預設快速選取
- 診間/醫師/基金會下拉選單
- 假髮押金預設值
- 一鍵載入/清除測試資料

### V1.0 (2026-03-21)
- 初始版本：物資管理、假髮管理、活動記錄、個案管理、轉介管理、資料備份

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
│   ├── components/      # Header、Modal、BottomNav、EmptyState
│   ├── pages/           # Dashboard、Supplies、Wigs、Reports、Patients、Settings
│   ├── services/        # IndexedDB 服務層
│   ├── types/           # TypeScript 型別定義
│   ├── utils.ts         # 工具函數
│   └── version.ts       # 版本資訊
└── README.md
```

---

## 📄 授權

© 2026 SELA - 彰濱癌症中心
