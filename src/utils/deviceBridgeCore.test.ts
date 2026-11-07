import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialAndroidDeviceState,
  executeDeviceAction,
} from './deviceBridgeCore';

test('flashlight toggle changes state and returns gemini response', () => {
  const initial = { ...initialAndroidDeviceState };
  assert.equal(initial.flashlight.enabled, false);

  const res1 = executeDeviceAction(initial, 'flashlight', { state: 'on' });
  assert.equal(res1.updatedState.flashlight.enabled, true);
  assert.equal(res1.geminiResponse.enabled, true);

  const res2 = executeDeviceAction(res1.updatedState, 'toggle_flashlight', { state: 'toggle' });
  assert.equal(res2.updatedState.flashlight.enabled, false);
});

test('vibrate increments haptic count and records pattern', () => {
  const initial = { ...initialAndroidDeviceState };
  const res = executeDeviceAction(initial, 'vibrate', { durationMs: 400, pattern: 'sos' });

  assert.equal(res.updatedState.hapticTriggerCount, 1);
  assert.equal(res.updatedState.lastHapticPattern, 'sos');
  assert.equal(res.geminiResponse.action, 'vibrate');
});

test('battery_status returns level and charging state', () => {
  const initial = { ...initialAndroidDeviceState, battery: { level: 95, charging: true } };
  const res = executeDeviceAction(initial, 'battery_status');

  assert.equal(res.geminiResponse.level, 95);
  assert.equal(res.geminiResponse.charging, true);
});

test('volume_control updates volume level and mute flag', () => {
  const initial = { ...initialAndroidDeviceState };
  const res = executeDeviceAction(initial, 'volume_control', { level: 45, mute: false });

  assert.equal(res.updatedState.volume.level, 45);
  assert.equal(res.updatedState.volume.muted, false);
});

test('send_notification adds a notification to drawer', () => {
  const initial = { ...initialAndroidDeviceState, notifications: [] };
  const res = executeDeviceAction(initial, 'send_notification', {
    title: 'Voice Alert',
    body: 'Battery is low',
  });

  assert.equal(res.updatedState.notifications.length, 1);
  assert.equal(res.updatedState.notifications[0].title, 'Voice Alert');
});

test('screen_brightness clamps between 0 and 100', () => {
  const initial = { ...initialAndroidDeviceState };
  const resOver = executeDeviceAction(initial, 'screen_brightness', { level: 150 });
  assert.equal(resOver.updatedState.brightness.level, 100);

  const resUnder = executeDeviceAction(initial, 'screen_brightness', { level: -20 });
  assert.equal(resUnder.updatedState.brightness.level, 0);
});

test('read_messages returns messages and marks them as read', () => {
  const initial = { ...initialAndroidDeviceState };
  const res = executeDeviceAction(initial, 'read_messages', { platform: 'whatsapp' });

  assert.equal(res.geminiResponse.action, 'read_messages');
  assert.ok(Number(res.geminiResponse.count) >= 1);
  assert.ok(res.updatedState.messages.find((m) => m.platform === 'whatsapp')?.unread === false);
});

test('reply_message appends reply to thread', () => {
  const initial = { ...initialAndroidDeviceState };
  const res = executeDeviceAction(initial, 'reply_message', {
    platform: 'whatsapp',
    recipient: 'Mom',
    message: 'Yes, I am on my way!',
  });

  assert.equal(res.geminiResponse.sent, true);
  const momMsg = res.updatedState.messages.find((m) => m.sender.includes('Mom'));
  assert.ok(momMsg);
  assert.equal(momMsg?.replies?.[momMsg.replies.length - 1].text, 'Yes, I am on my way!');
});

test('search_contacts finds Mom and Tanvir', () => {
  const initial = { ...initialAndroidDeviceState };
  const resMom = executeDeviceAction(initial, 'search_contacts', { query: 'আম্মু' });
  assert.equal(resMom.geminiResponse.count, 1);

  const resTanvir = executeDeviceAction(initial, 'search_contacts', { query: 'Tanvir' });
  assert.equal(resTanvir.geminiResponse.count, 1);
});

test('make_call initiates loudspeaker phone call', () => {
  const initial = { ...initialAndroidDeviceState };
  const res = executeDeviceAction(initial, 'make_call', {
    contactNameOrNumber: 'Mom',
    loudspeaker: true,
  });

  assert.equal(res.updatedState.activeCall?.active, true);
  assert.equal(res.updatedState.activeCall?.contactName, 'Mom');
  assert.equal(res.updatedState.activeCall?.loudspeaker, true);
});

test('publish_github_apk triggers APK build and returns release url', () => {
  const initial = { ...initialAndroidDeviceState };
  const res = executeDeviceAction(initial, 'publish_github_apk', {
    repo: 'mdshaikatmondol02-tech/SOHA',
  });

  assert.equal(res.geminiResponse.action, 'publish_github_apk');
  assert.equal(res.geminiResponse.status, 'triggered');
  assert.equal(res.updatedState.apkPublishState.status, 'triggered');
  assert.ok(String(res.geminiResponse.releaseUrl).includes('releases'));
});

test('analyze_phone_health generates diagnostic report and score', () => {
  const initial = { ...initialAndroidDeviceState };
  const res = executeDeviceAction(initial, 'analyze_phone_health', {});

  assert.equal(res.geminiResponse.action, 'analyze_phone_health');
  assert.ok(typeof res.geminiResponse.score === 'number');
  assert.ok(Number(res.geminiResponse.score) > 0);
  assert.ok(res.updatedState.healthReport !== null);
  assert.ok(res.updatedState.healthReport?.summaryBengali.length > 0);
});

test('add_custom_feature dynamically adds a new skill and persists', () => {
  const initial = { ...initialAndroidDeviceState };
  const countBefore = initial.customFeatures.length;
  const res = executeDeviceAction(initial, 'add_custom_feature', {
    name: 'Auto Weather Brief',
    description: 'Speaks daily morning weather',
    trigger: 'weather report',
    actionOrResponse: 'Check weather and announce temp',
    category: 'voice_skill',
  });

  assert.equal(res.geminiResponse.success, true);
  assert.equal(res.updatedState.customFeatures.length, countBefore + 1);
  assert.equal(res.updatedState.customFeatures[0].name, 'Auto Weather Brief');
});

test('edit_feature_or_settings modifies existing feature', () => {
  const initial = { ...initialAndroidDeviceState };
  const res = executeDeviceAction(initial, 'edit_feature_or_settings', {
    target: 'Family Calls',
    changes: 'Keep ringtone volume at maximum',
  });

  assert.equal(res.geminiResponse.success, true);
  const targetFeat = res.updatedState.customFeatures.find((f) => f.name.includes('Family Calls'));
  assert.ok(targetFeat);
  assert.ok(targetFeat?.description.includes('Keep ringtone volume at maximum'));
});

test('list_custom_features returns list of active features', () => {
  const initial = { ...initialAndroidDeviceState };
  const res = executeDeviceAction(initial, 'list_custom_features', {});

  assert.equal(res.geminiResponse.action, 'list_custom_features');
  assert.ok(Number(res.geminiResponse.count) >= 3);
});

