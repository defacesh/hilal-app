// src/components/AppText.js
import React, { memo, useMemo, forwardRef } from 'react';
import { Text, TextInput, StyleSheet } from 'react-native';
import { useAppFont, pickFontFamily } from '../hooks/useAppFont';

/* ================================================================
   Disleksi font boyut kompanzasyonu
   ----------------------------------------------------------------
   OpenDyslexic'in x-height'i sistem fontlarından daha büyük olduğu
   için aynı fontSize görsel olarak ~%10 daha büyük görünür. Bu
   sabit, disleksi aktifken fontSize'ı bu oranla çarpar.

   0.92 (yani %8 küçültme) iyi bir dengedir. Çok küçük geldiyse
   0.95, çok büyük geldiyse 0.88 deneyin.
   ================================================================ */
const DYSLEXIA_SIZE_COMPENSATION = 0.92;

/* ================================================================
   Arapça tespiti — OpenDyslexic'te Arapça glif yok
   ================================================================ */
const ARABIC_REGEX =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

function containsArabic(children) {
  if (typeof children === 'string') return ARABIC_REGEX.test(children);
  if (typeof children === 'number') return false;
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i += 1) {
      if (containsArabic(children[i])) return true;
    }
  }
  return false;
}

function shouldSkipDyslexia(style, children) {
  const flat = StyleSheet.flatten(style) || {};
  if (flat.fontFamily) return true;
  if (flat.writingDirection === 'rtl') return true;
  if (containsArabic(children)) return true;
  return false;
}

/* ================================================================
   Final style üretici — fontFamily + fontSize kompanzasyonu
   ----------------------------------------------------------------
   • fontWeight kaldırılır (iOS özel aile + ağırlık kombosunu
     bulamaz, "görünmez metin" riski)
   • fontSize disleksi ise hafifçe küçültülür
   • lineHeight DOKUNULMAZ (satır aralığı aynı kalsın, okunabilir)
   ================================================================ */
function buildFinalStyle(style, family, isDyslexia) {
  if (!family) return style;

  const flat = StyleSheet.flatten(style) || {};
  // eslint-disable-next-line no-unused-vars
  const { fontWeight: _ignoredWeight, fontSize, ...rest } = flat;

  const final = { ...rest, fontFamily: family };

  if (
    isDyslexia &&
    typeof fontSize === 'number' &&
    fontSize > 0
  ) {
    final.fontSize =
      Math.round(fontSize * DYSLEXIA_SIZE_COMPENSATION * 100) / 100;
  }

  return final;
}

/* ================================================================
   AppText
   ================================================================ */
const AppTextInner = forwardRef(function AppText(
  { style, children, ...props },
  ref,
) {
  const font = useAppFont();
  const skip = useMemo(
    () => shouldSkipDyslexia(style, children),
    [style, children],
  );

  const finalStyle = useMemo(() => {
    if (!font.isDyslexia || skip) return style;
    const family = pickFontFamily(style, font);
    return buildFinalStyle(style, family, true);
  }, [style, font, skip]);

  return (
    <Text ref={ref} {...props} style={finalStyle}>
      {children}
    </Text>
  );
});

export const AppText = memo(AppTextInner);

/* ================================================================
   AppTextInput
   ----------------------------------------------------------------
   ▸ DÜZELTME (placeholder font bug'ı)
   ----------------------------------------------------------------
   Android'de RN TextInput, mount edilmiş haldeyken `fontFamily`
   değişince placeholder/hint metnini YENİ font ile yeniden
   çizmiyor (native bug). Style güncellense bile native view
   içindeki placeholder eski font'ta donuyor.

   Çözüm: `key` prop'una `font.isDyslexia`'yı bağlamak.
   `key` değişince React TextInput'u unmount edip yeniden mount
   eder, native view sıfırdan yaratılır ve placeholder doğru
   fontla görünür.

   Bu düzeltme AppTextInput'un KULLANILDIĞI HER YERİ otomatik
   kapsar (SettingsScreen arama çubuğu, konum arama input'u, API
   anahtarı input'u, vs.). Dışarıdan ek prop taşımaya gerek yok.
   ================================================================ */
const AppTextInputInner = forwardRef(function AppTextInput(
  { style, ...props },
  ref,
) {
  const font = useAppFont();

  const finalStyle = useMemo(() => {
    if (!font.isDyslexia) return style;
    const flat = StyleSheet.flatten(style) || {};
    if (flat.fontFamily || flat.writingDirection === 'rtl') return style;
    const family = pickFontFamily(style, font);
    return buildFinalStyle(style, family, true);
  }, [style, font]);

  return (
    <TextInput
      ref={ref}
      // ▸ Native placeholder font cache'ini kırmak için remount.
      //   `font.isDyslexia` toggle olduğunda key değişir → TextInput
      //   yeniden yaratılır → placeholder yeni fontla çizilir.
      key={font.isDyslexia ? 'input-dyslexia' : 'input-normal'}
      {...props}
      style={finalStyle}
    />
  );
});

export const AppTextInput = memo(AppTextInputInner);