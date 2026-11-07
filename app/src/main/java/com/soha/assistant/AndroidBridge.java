package com.soha.assistant;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.media.AudioManager;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.provider.ContactsContract;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.net.URLEncoder;

public class AndroidBridge {
    private static final String TAG = "SOHA_Bridge";
    private static final String CHANNEL_ID = "soha_assistant_notifications";

    private final MainActivity activity;
    private final WebView webView;
    private boolean flashlightState = false;

    public AndroidBridge(MainActivity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        createNotificationChannel();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "SOHA Assistant Notifications",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            channel.setDescription("Notifications from SOHA Voice Assistant");
            NotificationManager manager = activity.getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @JavascriptInterface
    public boolean isNative() {
        return true;
    }

    @JavascriptInterface
    public void toggleFlashlight(boolean enable) {
        activity.runOnUiThread(() -> {
            try {
                CameraManager cameraManager = (CameraManager) activity.getSystemService(Context.CAMERA_SERVICE);
                if (cameraManager == null) return;

                for (String cameraId : cameraManager.getCameraIdList()) {
                    CameraCharacteristics characteristics = cameraManager.getCameraCharacteristics(cameraId);
                    Boolean hasFlash = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
                    Integer facing = characteristics.get(CameraCharacteristics.LENS_FACING);

                    if (Boolean.TRUE.equals(hasFlash) && facing != null && facing == CameraCharacteristics.LENS_FACING_BACK) {
                        cameraManager.setTorchMode(cameraId, enable);
                        flashlightState = enable;
                        Log.d(TAG, "Flashlight set to: " + enable);
                        break;
                    }
                }
            } catch (CameraAccessException | IllegalArgumentException e) {
                Log.e(TAG, "Failed to toggle flashlight", e);
            }
        });
    }

    @JavascriptInterface
    public void vibrate(long ms) {
        activity.runOnUiThread(() -> {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    VibratorManager vm = (VibratorManager) activity.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                    if (vm != null) {
                        vm.getDefaultVibrator().vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
                    }
                } else {
                    Vibrator v = (Vibrator) activity.getSystemService(Context.VIBRATOR_SERVICE);
                    if (v != null) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
                        } else {
                            v.vibrate(ms);
                        }
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Vibrate error", e);
            }
        });
    }

    @JavascriptInterface
    public void showNotification(String title, String body) {
        activity.runOnUiThread(() -> {
            try {
                NotificationManager manager = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
                if (manager == null) return;

                NotificationCompat.Builder builder = new NotificationCompat.Builder(activity, CHANNEL_ID)
                        .setSmallIcon(android.R.drawable.ic_dialog_info)
                        .setContentTitle(title)
                        .setContentText(body)
                        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                        .setAutoCancel(true);

                manager.notify((int) System.currentTimeMillis(), builder.build());
            } catch (Exception e) {
                Log.e(TAG, "Failed to show notification", e);
            }
        });
    }

    @JavascriptInterface
    public void setVolume(int level) {
        activity.runOnUiThread(() -> {
            try {
                AudioManager audioManager = (AudioManager) activity.getSystemService(Context.AUDIO_SERVICE);
                if (audioManager == null) return;

                int max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                int target = (int) Math.round((Math.max(0, Math.min(100, level)) / 100.0) * max);
                audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, target, AudioManager.FLAG_SHOW_UI);
            } catch (Exception e) {
                Log.e(TAG, "Failed to set volume", e);
            }
        });
    }

    @JavascriptInterface
    public boolean openApp(String appNameOrPackage) {
        if (appNameOrPackage == null || appNameOrPackage.trim().isEmpty()) return false;
        final String input = appNameOrPackage.trim().toLowerCase();

        return tryLaunchPackage(resolvePackageName(input));
    }

    private String resolvePackageName(String name) {
        switch (name) {
            case "whatsapp":
                return "com.whatsapp";
            case "whatsapp business":
                return "com.whatsapp.w4b";
            case "messenger":
            case "fb messenger":
                return "com.facebook.orca";
            case "telegram":
                return "org.telegram.messenger";
            case "imo":
                return "com.imo.android.imoim";
            case "chrome":
                return "com.android.chrome";
            case "youtube":
                return "com.google.android.youtube";
            case "camera":
                return "com.android.camera";
            case "settings":
                return "com.android.settings";
            default:
                return name; // Might already be a package name
        }
    }

    private boolean tryLaunchPackage(String packageName) {
        try {
            Intent launchIntent = activity.getPackageManager().getLaunchIntentForPackage(packageName);
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(launchIntent);
                return true;
            } else {
                // If specific package not found, search Play Store or open browser
                Intent marketIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + packageName));
                marketIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(marketIntent);
                return true;
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not launch package: " + packageName, e);
            return false;
        }
    }

    @JavascriptInterface
    public boolean makeCall(String phoneNumber) {
        try {
            Intent dialIntent = new Intent(Intent.ACTION_DIAL);
            dialIntent.setData(Uri.parse("tel:" + Uri.encode(phoneNumber.trim())));
            dialIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(dialIntent);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch dialer", e);
            return false;
        }
    }

    @JavascriptInterface
    public boolean openWhatsApp(String phoneNumber, String message) {
        try {
            String url = "https://api.whatsapp.com/send?phone=" + Uri.encode(phoneNumber) +
                    (message != null ? "&text=" + URLEncoder.encode(message, "UTF-8") : "");
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setData(Uri.parse(url));
            intent.setPackage("com.whatsapp");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(intent);
            return true;
        } catch (Exception e) {
            // Fallback: try opening without package constraint
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://api.whatsapp.com/send?phone=" + Uri.encode(phoneNumber)));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(intent);
                return true;
            } catch (Exception ex) {
                Log.e(TAG, "Failed to launch WhatsApp", ex);
                return false;
            }
        }
    }

    @JavascriptInterface
    public int getBatteryLevel() {
        try {
            BatteryManager bm = (BatteryManager) activity.getSystemService(Context.BATTERY_SERVICE);
            if (bm != null) {
                return bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
            }
        } catch (Exception e) {
            Log.e(TAG, "Battery level query failed", e);
        }
        return 80;
    }

    @JavascriptInterface
    public boolean isCharging() {
        try {
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = activity.registerReceiver(null, ifilter);
            if (batteryStatus != null) {
                int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
                return status == BatteryManager.BATTERY_STATUS_CHARGING ||
                        status == BatteryManager.BATTERY_STATUS_FULL;
            }
        } catch (Exception e) {
            Log.e(TAG, "Battery charging status failed", e);
        }
        return false;
    }

    @JavascriptInterface
    public String searchContacts(String query) {
        JSONArray results = new JSONArray();
        try {
            Uri uri = ContactsContract.CommonDataKinds.Phone.CONTENT_URI;
            String selection = ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " LIKE ?";
            String[] selectionArgs = new String[]{"%" + query + "%"};

            Cursor cursor = activity.getContentResolver().query(uri, null, selection, selectionArgs, null);
            if (cursor != null) {
                int nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                int numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);

                while (cursor.moveToNext() && results.length() < 10) {
                    String name = cursor.getString(nameIndex);
                    String number = cursor.getString(numberIndex);
                    JSONObject contact = new JSONObject();
                    contact.put("name", name);
                    contact.put("phone", number);
                    results.put(contact);
                }
                cursor.close();
            }
        } catch (Exception e) {
            Log.w(TAG, "Contact search permission or query issue", e);
        }
        return results.toString();
    }
}
