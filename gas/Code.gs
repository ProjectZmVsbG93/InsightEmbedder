/**
 * 研究データ収集システム - Google Apps Script
 * 
 * 設定方法：
 * 1. SPREADSHEET_ID にGoogle SpreadsheetのIDを設定
 * 2. ウェブアプリとしてデプロイ（「新しいデプロイ」→「ウェブアプリ」）
 * 3. アクセス権限を「全員」に設定
 */

// ============================================
// 設定
// ============================================
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // ← ここにスプレッドシートIDを貼り付け
const MAIN_SHEET_NAME = 'シート1'; // メインシート名（必要に応じて変更）

// 月からモチベ列へのマッピング（4月=I列(9), 5月=J列(10), ... 3月=T列(20)）
const MONTH_TO_COLUMN = {
  '4': 9,   // I列
  '5': 10,  // J列
  '6': 11,  // K列
  '7': 12,  // L列
  '8': 13,  // M列
  '9': 14,  // N列
  '10': 15, // O列
  '11': 16, // P列
  '12': 17, // Q列
  '1': 18,  // R列
  '2': 19,  // S列
  '3': 20   // T列
};

// 月から自由記述列へのマッピング（4月=U列(21), 5月=V列(22), ... 3月=AF列(32)）
const MONTH_TO_REASON_COLUMN = {
  '4': 21,  // U列
  '5': 22,  // V列
  '6': 23,  // W列
  '7': 24,  // X列
  '8': 25,  // Y列
  '9': 26,  // Z列
  '10': 27, // AA列
  '11': 28, // AB列
  '12': 29, // AC列
  '1': 30,  // AD列
  '2': 31,  // AE列
  '3': 32   // AF列
};

// ============================================
// メイン関数
// ============================================

/**
 * GETリクエスト処理 - 生徒名一覧を返す（JSONP対応）
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(MAIN_SHEET_NAME);
    
    if (!sheet) {
      return createJsonpResponse(e, { error: 'シートが見つかりません: ' + MAIN_SHEET_NAME });
    }
    
    // D列（氏名）を取得（2行目から最終行まで、1行目はヘッダー）
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return createJsonpResponse(e, { students: [] });
    }
    
    const names = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
    const studentList = names
      .map(row => row[0])
      .filter(name => name && name.toString().trim() !== '');
    
    return createJsonpResponse(e, { 
      success: true,
      students: studentList 
    });
    
  } catch (error) {
    return createJsonpResponse(e, { 
      error: 'エラーが発生しました: ' + error.message 
    });
  }
}

/**
 * POSTリクエスト処理 - データを記録
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // 必須項目チェック
    if (!data.name || !data.month || data.motivation === undefined) {
      return createJsonResponse({ 
        error: '必須項目が不足しています（氏名、月、モチベーション）' 
      });
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
    
    if (!mainSheet) {
      return createJsonResponse({ error: 'メインシートが見つかりません' });
    }
    
    // 氏名から行を検索
    const lastRow = mainSheet.getLastRow();
    const names = mainSheet.getRange(2, 4, lastRow - 1, 1).getValues();
    
    let targetRow = -1;
    for (let i = 0; i < names.length; i++) {
      if (names[i][0] === data.name) {
        targetRow = i + 2; // 1-indexed + ヘッダー行
        break;
      }
    }
    
    if (targetRow === -1) {
      return createJsonResponse({ 
        error: '指定された氏名が見つかりません: ' + data.name 
      });
    }
    
    // モチベーション値を記録
    const column = MONTH_TO_COLUMN[data.month.toString()];
    if (!column) {
      return createJsonResponse({ 
        error: '無効な月です: ' + data.month 
      });
    }
    
    mainSheet.getRange(targetRow, column).setValue(data.motivation);
    
    // 自由記述がある場合は同じ行の記述列に記録
    if (data.reason && data.reason.trim() !== '') {
      const reasonColumn = MONTH_TO_REASON_COLUMN[data.month.toString()];
      if (reasonColumn) {
        mainSheet.getRange(targetRow, reasonColumn).setValue(data.reason);
      }
    }
    
    return createJsonResponse({ 
      success: true,
      message: 'データを記録しました',
      recorded: {
        name: data.name,
        month: data.month + '月',
        motivation: data.motivation,
        hasReason: !!data.reason
      }
    });
    
  } catch (error) {
    return createJsonResponse({ 
      error: 'エラーが発生しました: ' + error.message 
    });
  }
}

/**
 * JSONP形式のレスポンスを作成（CORS対策）
 */
function createJsonpResponse(e, data) {
  const callback = e && e.parameter && e.parameter.callback;
  const jsonStr = JSON.stringify(data);
  
  if (callback) {
    // JSONP形式で返す
    return ContentService
      .createTextOutput(callback + '(' + jsonStr + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // 通常のJSON形式で返す
    return ContentService
      .createTextOutput(jsonStr)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * JSON形式のレスポンスを作成
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * テスト用関数 - スプレッドシート接続確認
 */
function testConnection() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(MAIN_SHEET_NAME);
    Logger.log('接続成功: ' + sheet.getName());
    Logger.log('最終行: ' + sheet.getLastRow());
  } catch (error) {
    Logger.log('接続失敗: ' + error.message);
  }
}
