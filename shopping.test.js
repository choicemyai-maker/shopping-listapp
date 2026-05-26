const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, 'shopping-list.html').replace(/\\/g, '/');

test.beforeEach(async ({ page }) => {
  await page.goto(FILE_URL);
  // localStorage 초기화 (이전 테스트 데이터 제거)
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

// ─────────────────────────────────────────
// 1. 아이템 추가
// ─────────────────────────────────────────
test('아이템 추가 - 버튼 클릭', async ({ page }) => {
  await page.fill('#itemInput', '사과');
  await page.click('button:has-text("추가")');

  const items = page.locator('.item-text');
  await expect(items).toHaveCount(1);
  await expect(items.first()).toHaveText('사과');
});

test('아이템 추가 - Enter 키', async ({ page }) => {
  await page.fill('#itemInput', '바나나');
  await page.press('#itemInput', 'Enter');

  await expect(page.locator('.item-text')).toHaveCount(1);
  await expect(page.locator('.item-text').first()).toHaveText('바나나');
});

test('아이템 추가 - 입력 후 입력창 초기화', async ({ page }) => {
  await page.fill('#itemInput', '우유');
  await page.click('button:has-text("추가")');

  await expect(page.locator('#itemInput')).toHaveValue('');
});

test('아이템 추가 - 여러 개 추가', async ({ page }) => {
  const items = ['사과', '바나나', '우유', '빵', '계란'];
  for (const item of items) {
    await page.fill('#itemInput', item);
    await page.press('#itemInput', 'Enter');
  }

  await expect(page.locator('.item-text')).toHaveCount(5);
});

test('아이템 추가 - 빈 문자열 무시', async ({ page }) => {
  await page.fill('#itemInput', '   ');
  await page.click('button:has-text("추가")');

  await expect(page.locator('.item-text')).toHaveCount(0);
  await expect(page.locator('#empty')).toBeVisible();
});

// ─────────────────────────────────────────
// 2. 아이템 삭제
// ─────────────────────────────────────────
test('아이템 삭제 - 단일 삭제', async ({ page }) => {
  await page.fill('#itemInput', '지울항목');
  await page.press('#itemInput', 'Enter');

  await expect(page.locator('.item-text')).toHaveCount(1);

  await page.click('.delete-btn');
  await expect(page.locator('.item-text')).toHaveCount(0);
  await expect(page.locator('#empty')).toBeVisible();
});

test('아이템 삭제 - 여러 개 중 특정 항목 삭제', async ({ page }) => {
  for (const item of ['첫번째', '두번째', '세번째']) {
    await page.fill('#itemInput', item);
    await page.press('#itemInput', 'Enter');
  }

  // 두번째 항목 삭제 (index 1)
  await page.locator('.delete-btn').nth(1).click();

  const remaining = page.locator('.item-text');
  await expect(remaining).toHaveCount(2);
  await expect(remaining.nth(0)).toHaveText('첫번째');
  await expect(remaining.nth(1)).toHaveText('세번째');
});

test('아이템 삭제 - 전체 삭제', async ({ page }) => {
  for (const item of ['A', 'B', 'C']) {
    await page.fill('#itemInput', item);
    await page.press('#itemInput', 'Enter');
  }

  const btns = page.locator('.delete-btn');
  // 뒤에서부터 삭제 (index 유지)
  await btns.nth(2).click();
  await btns.nth(1).click();
  await btns.nth(0).click();

  await expect(page.locator('.item-text')).toHaveCount(0);
  await expect(page.locator('#empty')).toBeVisible();
});

// ─────────────────────────────────────────
// 3. 체크 기능
// ─────────────────────────────────────────
test('체크 - 체크박스 클릭 시 완료 스타일 적용', async ({ page }) => {
  await page.fill('#itemInput', '체크테스트');
  await page.press('#itemInput', 'Enter');

  const li = page.locator('li').first();
  await expect(li).not.toHaveClass(/checked/);

  await li.locator('input[type="checkbox"]').click();
  await expect(li).toHaveClass(/checked/);
});

test('체크 - 재클릭 시 체크 해제', async ({ page }) => {
  await page.fill('#itemInput', '토글테스트');
  await page.press('#itemInput', 'Enter');

  const cb = page.locator('input[type="checkbox"]').first();
  await cb.click();
  await expect(page.locator('li').first()).toHaveClass(/checked/);

  await cb.click();
  await expect(page.locator('li').first()).not.toHaveClass(/checked/);
});

test('체크 - 완료된 항목 일괄 삭제 버튼 표시', async ({ page }) => {
  await page.fill('#itemInput', '항목1');
  await page.press('#itemInput', 'Enter');
  await page.fill('#itemInput', '항목2');
  await page.press('#itemInput', 'Enter');

  await expect(page.locator('#clearBtn')).toBeHidden();

  await page.locator('input[type="checkbox"]').first().click();
  await expect(page.locator('#clearBtn')).toBeVisible();
});

test('체크 - 완료된 항목 일괄 삭제', async ({ page }) => {
  for (const item of ['남길항목', '삭제할항목1', '삭제할항목2']) {
    await page.fill('#itemInput', item);
    await page.press('#itemInput', 'Enter');
  }

  // 2번째, 3번째 체크
  await page.locator('input[type="checkbox"]').nth(1).click();
  await page.locator('input[type="checkbox"]').nth(2).click();

  await page.click('#clearBtn');

  const remaining = page.locator('.item-text');
  await expect(remaining).toHaveCount(1);
  await expect(remaining.first()).toHaveText('남길항목');
  await expect(page.locator('#clearBtn')).toBeHidden();
});

// ─────────────────────────────────────────
// 4. 통계 카운터
// ─────────────────────────────────────────
test('통계 - 완료 카운터 업데이트', async ({ page }) => {
  for (const item of ['A', 'B', 'C']) {
    await page.fill('#itemInput', item);
    await page.press('#itemInput', 'Enter');
  }

  await expect(page.locator('#stats')).toHaveText('0 / 3 완료');

  await page.locator('input[type="checkbox"]').nth(0).click();
  await expect(page.locator('#stats')).toHaveText('1 / 3 완료');

  await page.locator('input[type="checkbox"]').nth(1).click();
  await expect(page.locator('#stats')).toHaveText('2 / 3 완료');
});

// ─────────────────────────────────────────
// 5. localStorage 유지
// ─────────────────────────────────────────
test('localStorage - 새로고침 후 데이터 유지', async ({ page }) => {
  for (const item of ['지속항목1', '지속항목2']) {
    await page.fill('#itemInput', item);
    await page.press('#itemInput', 'Enter');
  }
  await page.locator('input[type="checkbox"]').first().click();

  await page.reload();

  await expect(page.locator('.item-text')).toHaveCount(2);
  await expect(page.locator('li').first()).toHaveClass(/checked/);
});
