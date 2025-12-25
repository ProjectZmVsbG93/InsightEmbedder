/**
 * 学習モチベーション調査 - フロントエンドスクリプト
 */

// ============================================
// 設定
// ============================================
// ↓ GASのウェブアプリURLをここに貼り付け
const GAS_URL = 'https://script.google.com/macros/s/AKfycbx_v_p0O2u2GrSRT21dTuWhEycuC-IESISTngX6IkYaKqZyzC5G31QNDkFKvG5Se5z1/exec';

// ============================================
// DOM要素
// ============================================
const form = document.getElementById('motivation-form');
const studentSelect = document.getElementById('student-name');
const monthSelect = document.getElementById('month');
const reasonTextarea = document.getElementById('reason');
const submitBtn = document.getElementById('submit-btn');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoading = submitBtn.querySelector('.btn-loading');
const resultMessage = document.getElementById('result-message');

// ============================================
// 初期化
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  loadStudents();
  setDefaultMonth();
});

/**
 * 生徒名一覧を読み込む（JSONP方式でCORS回避）
 */
function loadStudents() {
  studentSelect.innerHTML = '<option value="">読み込み中...</option>';

  // JSONP用のコールバック関数名を一意に生成
  const callbackName = 'jsonpCallback_' + Date.now();

  // グローバルにコールバック関数を登録
  window[callbackName] = function (data) {
    // コールバック関数をクリーンアップ
    delete window[callbackName];
    document.body.removeChild(script);

    if (data.error) {
      console.error('GASエラー:', data.error);
      studentSelect.innerHTML = '<option value="">読み込みエラー</option>';
      showMessage('生徒一覧の読み込みに失敗しました: ' + data.error, 'error');
      return;
    }

    if (data.students && data.students.length > 0) {
      studentSelect.innerHTML = '<option value="">氏名を選択してください</option>';
      data.students.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        studentSelect.appendChild(option);
      });
    } else {
      studentSelect.innerHTML = '<option value="">生徒が登録されていません</option>';
    }
  };

  // JSONP用のscriptタグを作成
  const script = document.createElement('script');
  script.src = GAS_URL + '?callback=' + callbackName;
  script.onerror = function () {
    delete window[callbackName];
    document.body.removeChild(script);
    console.error('生徒一覧の読み込みに失敗しました');
    studentSelect.innerHTML = '<option value="">読み込みエラー</option>';
    showMessage('生徒一覧の読み込みに失敗しました。ページを再読み込みしてください。', 'error');
  };

  document.body.appendChild(script);
}

/**
 * 現在の月をデフォルト選択
 */
function setDefaultMonth() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 0-indexed
  monthSelect.value = currentMonth.toString();
}

/**
 * フォーム送信処理
 */
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // バリデーション
  const name = studentSelect.value;
  const month = monthSelect.value;
  const motivationEl = document.querySelector('input[name="motivation"]:checked');
  const reason = reasonTextarea.value.trim();

  if (!name) {
    showMessage('氏名を選択してください。', 'error');
    return;
  }

  if (!month) {
    showMessage('月を選択してください。', 'error');
    return;
  }

  if (!motivationEl) {
    showMessage('モチベーションを選択してください。', 'error');
    return;
  }

  const motivation = parseInt(motivationEl.value, 10);

  // 送信中の表示
  setLoading(true);
  hideMessage();

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        month: month,
        motivation: motivation,
        reason: reason
      }),
      mode: 'no-cors' // CORSエラー回避（GASの制限）
    });

    // no-corsモードではレスポンスが読めないため、成功とみなす
    showMessage(`回答を送信しました！`, 'success');

    // フォームリセット
    form.reset();
    setDefaultMonth();

  } catch (error) {
    console.error('送信エラー:', error);
    showMessage('送信に失敗しました。もう一度お試しください。', 'error');
  } finally {
    setLoading(false);
  }
});

/**
 * ローディング状態の切り替え
 */
function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  btnText.style.display = isLoading ? 'none' : 'inline';
  btnLoading.style.display = isLoading ? 'inline' : 'none';
}

/**
 * メッセージ表示
 */
function showMessage(message, type) {
  resultMessage.textContent = message;
  resultMessage.className = `result-message ${type}`;
  resultMessage.style.display = 'block';

  // スクロール
  resultMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * メッセージ非表示
 */
function hideMessage() {
  resultMessage.style.display = 'none';
}
