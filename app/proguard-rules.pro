# Proguard rules for SOHA Android Assistant
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.soha.assistant.AndroidBridge { *; }
