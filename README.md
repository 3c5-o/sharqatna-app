# شرقاطنا

تطبيق محلي لدليل سواق الشرقاط، يتضمن نسخة مستخدم ونسخة إدارة منفصلتين لنظام Android.

## الحزم

- المستخدم: `com.sharqatna.user`
- الإدارة: `com.sharqatna.admin`

## البناء

كل Push إلى `main` يشغّل GitHub Actions ويبني ملفين:

- `Sharqatna-User.apk`
- `Sharqatna-Admin.apk`

يمكن تنزيلهما من تبويب Actions ضمن artifact باسم `Sharqatna-Android-APKs`.

## إعداد الإدارة الآمن

1. فعّل Email/Password وAnonymous Authentication في Firebase.
2. أنشئ مستخدم الإدارة من Firebase Authentication.
3. أنشئ وثيقة في `admins/{uid}` لذلك المستخدم.
4. انشر القواعد بالأمر `firebase deploy --only firestore`.
5. عرّف مفتاح OneSignal في Firebase Secrets: `firebase functions:secrets:set ONESIGNAL_API_KEY`.
6. انشر القواعد والدالة: `firebase deploy --only firestore,functions`.

## OneSignal

معرّف التطبيق المستخدم: `017ed702-163e-41f6-9dbc-50e2aa29c926` (`shariqatuna`). يلزم ربط إعداد Android/FCM في لوحة OneSignal حتى تصل إشعارات APK الأصلية.
