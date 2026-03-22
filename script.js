/**
 * 学習モチベーション調査 - フロントエンドスクリプト
 */

// ============================================
// 設定
// ============================================
// ↓ GASのウェブアプリURLをここに貼り付け
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyK0RWiTSelOCBT_8jGrLXDWM3FsgcYUov_l4l1-PX0kwfe7F2g6B23_YMU127isdxP/exec';

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
const chartContainer = document.getElementById('chart-container');
const chartCanvas = document.getElementById('motivation-chart');
let motivationChart = null;
let cachedHistory = null; // 選択中の生徒の履歴をキャッシュ

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
 * 氏名変更時にモチベーション履歴を取得
 */
studentSelect.addEventListener('change', () => {
  const name = studentSelect.value;
  cachedHistory = null;
  if (!name) {
    chartContainer.style.display = 'none';
    if (motivationChart) {
      motivationChart.destroy();
      motivationChart = null;
    }
    return;
  }
  loadHistory(name);
});

/**
 * モチベーション履歴を読み込む（JSONP方式）
 */
function loadHistory(name) {
  const callbackName = 'historyCallback_' + Date.now();

  window[callbackName] = function (data) {
    delete window[callbackName];
    document.body.removeChild(script);

    if (data.error || !data.success) {
      chartContainer.style.display = 'none';
      return;
    }

    cachedHistory = data.history;
    renderChart(data.history);
  };

  const params = new URLSearchParams({
    action: 'history',
    callback: callbackName,
    name: name
  });

  const script = document.createElement('script');
  script.src = GAS_URL + '?' + params.toString();
  script.onerror = function () {
    delete window[callbackName];
    document.body.removeChild(script);
  };

  document.body.appendChild(script);
}

/**
 * グラフを描画
 */
function renderChart(history) {
  if (!history) {
    chartContainer.style.display = 'none';
    return;
  }

  const months = ['4', '5', '6', '7', '8', '9', '10', '11', '12', '1', '2', '3'];
  const labels = months.map(m => m + '月');
  const dataPoints = months.map(m => history[m] !== undefined ? history[m] : null);

  // データが全てnullなら非表示
  if (dataPoints.every(v => v === null)) {
    chartContainer.style.display = 'none';
    return;
  }

  chartContainer.style.display = 'block';

  if (motivationChart) {
    motivationChart.destroy();
  }

  // モバイル判定
  const isMobile = window.innerWidth <= 767;
  const fontSize = isMobile ? 9 : 12;
  const labelFontSize = isMobile ? 9 : 11;
  const pointSize = isMobile ? 2.5 : 3.5;

  motivationChart = new Chart(chartCanvas, {
    type: 'line',
    plugins: [ChartDataLabels],
    data: {
      labels: labels,
      datasets: [{
        label: 'モチベーション',
        data: dataPoints,
        borderColor: '#0d2850',
        backgroundColor: 'rgba(13, 40, 80, 0.05)',
        borderWidth: 2,
        pointBackgroundColor: '#0d2850',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: dataPoints.map(v => v === null ? 0 : pointSize),
        pointHoverRadius: pointSize + 2,
        tension: 0.3,
        fill: true,
        spanGaps: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: isMobile ? 16 : 24, right: 4, bottom: isMobile ? 4 : 8, left: 4 }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          color: '#0d2850',
          font: {
            family: '"Noto Serif JP", serif',
            size: labelFontSize,
            weight: 700
          },
          anchor: function (context) {
            const value = context.dataset.data[context.dataIndex];
            return value >= 0 ? 'end' : 'start';
          },
          align: function (context) {
            const value = context.dataset.data[context.dataIndex];
            return value >= 0 ? 'top' : 'bottom';
          },
          offset: 6,
          formatter: function (value) {
            if (value === null) return '';
            return value > 0 ? '+' + value : value;
          },
          display: function (context) {
            return context.dataset.data[context.dataIndex] !== null;
          }
        }
      },
      scales: {
        y: {
          min: -3,
          max: 3,
          ticks: {
            stepSize: 1,
            callback: function (value) {
              if (Number.isInteger(value) && value >= -2 && value <= 2) {
                return value > 0 ? '+' + value : String(value);
              }
              return '';
            },
            font: {
              family: '"Noto Serif JP", serif',
              size: fontSize
            },
            color: '#0d2850',
            padding: 8
          },
          grid: {
            color: function (context) {
              return context.tick.value === 0 ? 'rgba(13, 40, 80, 0.4)' : 'rgba(13, 40, 80, 0.08)';
            },
            lineWidth: function (context) {
              return context.tick.value === 0 ? 1.5 : 1;
            }
          },
          border: { display: false }
        },
        x: {
          ticks: {
            font: {
              family: '"Noto Serif JP", serif',
              size: isMobile ? 9 : 11
            },
            color: '#0d2850'
          },
          grid: { display: false },
          border: { display: false }
        }
      }
    }
  });
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

  // 既存データがある場合は上書き確認
  if (cachedHistory && cachedHistory[month] !== null && cachedHistory[month] !== undefined) {
    const monthLabel = month + '月';
    const existingVal = cachedHistory[month];
    const confirmed = confirm(
      `${monthLabel}にはすでにデータ（${existingVal > 0 ? '+' : ''}${existingVal}）が記録されています。\n上書きしますか？`
    );
    if (!confirmed) return;
  }

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

    // キャッシュ更新
    if (cachedHistory) {
      cachedHistory[month] = motivation;
    }

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
