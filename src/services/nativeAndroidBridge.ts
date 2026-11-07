/**
 * Native Android Bridge Service
 * Supports Capacitor native plugins, Android WebView JavascriptInterface (window.AndroidBridge),
 * browser Web APIs (torch, vibration, battery, notifications), and simulated mode for APK testing.
 */

import { AndroidDeviceState, executeDeviceAction, DeviceActionResult } from '../utils/deviceBridgeCore';

export interface NativeBridgeCapabilities {
  isNativeApk: boolean;
  bridgeType: 'capacitor' | 'android-interface' | 'web-apis' | 'simulation';
  hasTorch: boolean;
  hasVibration: boolean;
  hasBatteryApi: boolean;
  hasNotifications: boolean;
  hasNetworkApi: boolean;
}

class NativeAndroidBridge {
  private torchTrack: MediaStreamTrack | null = null;
  private torchStream: MediaStream | null = null;

  /**
   * Detects available native Android bridges or web APIs
   */
  public detectCapabilities(): NativeBridgeCapabilities {
    const win = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : {};
    const capacitor = win.Capacitor as { isNativePlatform?: () => boolean } | undefined;
    const isCapacitorNative = Boolean(capacitor?.isNativePlatform?.());
    const hasAndroidInterface = Boolean(win.AndroidBridge || win.Android);

    const isNativeApk = isCapacitorNative || hasAndroidInterface;
    let bridgeType: NativeBridgeCapabilities['bridgeType'] = 'simulation';

    if (isCapacitorNative) {
      bridgeType = 'capacitor';
    } else if (hasAndroidInterface) {
      bridgeType = 'android-interface';
    } else if (typeof navigator !== 'undefined') {
      bridgeType = 'web-apis';
    }

    return {
      isNativeApk,
      bridgeType,
      hasTorch: typeof navigator !== 'undefined' && 'mediaDevices' in navigator,
      hasVibration: typeof navigator !== 'undefined' && 'vibrate' in navigator,
      hasBatteryApi: typeof navigator !== 'undefined' && 'getBattery' in navigator,
      hasNotifications: typeof window !== 'undefined' && 'Notification' in window,
      hasNetworkApi: typeof navigator !== 'undefined' && 'onLine' in navigator,
    };
  }

  /**
   * Dispatches an Android device action to either Capacitor, Android JavascriptInterface,
   * modern Web APIs, or the local simulator state.
   */
  public async dispatchAction(
    currentState: AndroidDeviceState,
    actionName: string,
    params: Record<string, unknown> = {},
    source: 'gemini' | 'user' | 'system' = 'gemini'
  ): Promise<DeviceActionResult> {
    const caps = this.detectCapabilities();
    const win = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : {};

    // 1. Try Native Capacitor Plugins if packaged as APK
    const capacitor = win.Capacitor as {
      Plugins?: {
        Haptics?: { vibrate: (opts: { duration: number }) => Promise<void> };
        Device?: { getBatteryInfo: () => Promise<{ batteryLevel: number; isCharging: boolean }> };
        LocalNotifications?: { schedule: (opts: { notifications: Array<{ title: string; body: string; id: number }> }) => Promise<void> };
      };
    } | undefined;

    if (caps.isNativeApk && capacitor?.Plugins) {
      try {
        if (actionName === 'vibrate' && capacitor.Plugins.Haptics) {
          const duration = Number(params.durationMs ?? 200);
          await capacitor.Plugins.Haptics.vibrate({ duration });
        } else if (actionName === 'battery_status' && capacitor.Plugins.Device) {
          const battery = await capacitor.Plugins.Device.getBatteryInfo();
          if (battery) {
            params.level = Math.round(battery.batteryLevel * 100);
            params.charging = battery.isCharging;
          }
        } else if (actionName === 'send_notification' && capacitor.Plugins.LocalNotifications) {
          await capacitor.Plugins.LocalNotifications.schedule({
            notifications: [
              {
                id: Math.floor(Math.random() * 100000),
                title: String(params.title ?? 'Gemini Live'),
                body: String(params.body ?? ''),
              },
            ],
          });
        }
      } catch (err) {
        console.warn('[NativeBridge] Capacitor plugin invocation notice:', err);
      }
    }

    // 2. Try Android JavascriptInterface (window.AndroidBridge or window.Android)
    const androidInterface = (win.AndroidBridge || win.Android) as {
      toggleFlashlight?: (enabled: boolean) => void;
      vibrate?: (ms: number) => void;
      showNotification?: (title: string, msg: string) => void;
      setVolume?: (level: number) => void;
      openApp?: (name: string) => boolean;
      makeCall?: (number: string) => boolean;
      openWhatsApp?: (number: string, message?: string) => boolean;
      searchContacts?: (query: string) => string;
      getBatteryLevel?: () => number;
      isCharging?: () => boolean;
    } | undefined;

    if (androidInterface) {
      try {
        if (actionName === 'flashlight' && androidInterface.toggleFlashlight) {
          const enabled = params.state === 'on' || (params.state === 'toggle' ? !currentState.flashlight.enabled : false);
          androidInterface.toggleFlashlight(enabled);
        } else if (actionName === 'vibrate' && androidInterface.vibrate) {
          androidInterface.vibrate(Number(params.durationMs ?? 200));
        } else if (actionName === 'send_notification' && androidInterface.showNotification) {
          androidInterface.showNotification(String(params.title ?? 'SOHA Assistant'), String(params.body ?? ''));
        } else if (actionName === 'volume_control' && androidInterface.setVolume && typeof params.level === 'number') {
          androidInterface.setVolume(params.level);
        } else if (actionName === 'open_app' && androidInterface.openApp && params.appName) {
          androidInterface.openApp(String(params.appName));
        } else if (actionName === 'make_call' && androidInterface.makeCall) {
          const target = String(params.contactNameOrNumber || params.target || params.phone || '');
          if (target) androidInterface.makeCall(target);
        } else if ((actionName === 'send_message' || actionName === 'reply_message') && androidInterface.openWhatsApp && params.platform === 'whatsapp') {
          androidInterface.openWhatsApp(String(params.recipient || ''), String(params.message || ''));
        }
      } catch (err) {
        console.warn('[NativeBridge] Android WebView Interface notice:', err);
      }
    }

    // 3. Web API hardware triggers
    if (actionName === 'vibrate' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        const ms = Number(params.durationMs ?? 200);
        navigator.vibrate(ms);
      } catch {
        // Ignored if user hasn't interacted or unsupported
      }
    }

    if (actionName === 'flashlight') {
      try {
        await this.handleWebTorch(params.state === 'on' || (params.state === 'toggle' ? !currentState.flashlight.enabled : false));
      } catch (e) {
        console.info('[NativeBridge] Browser torch fallback active:', e);
      }
    }

    if (actionName === 'send_notification' && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          new Notification(String(params.title ?? 'Gemini Live'), {
            body: String(params.body ?? ''),
            icon: '/favicon.ico',
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      } catch {
        // Notification permission optional
      }
    }

    // 4. Update the state store and return deterministic payload
    return executeDeviceAction(currentState, actionName, params, source);
  }

  /**
   * Hardware Web Camera Torch toggle
   */
  private async handleWebTorch(enable: boolean): Promise<void> {
    if (!enable) {
      if (this.torchTrack) {
        this.torchTrack.stop();
        this.torchTrack = null;
      }
      if (this.torchStream) {
        this.torchStream.getTracks().forEach((t) => t.stop());
        this.torchStream = null;
      }
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return;
    }

    try {
      this.torchStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        },
      });
      const track = this.torchStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined;
      if (capabilities && capabilities.torch) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (track as any).applyConstraints({
          advanced: [{ torch: true }],
        });
        this.torchTrack = track;
      }
    } catch {
      // Hardware torch unavailable in headless/desktop; simulation takes over
    }
  }
}

export const nativeBridge = new NativeAndroidBridge();
