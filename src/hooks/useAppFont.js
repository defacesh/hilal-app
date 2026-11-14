// src/hooks/useAppFont.js
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useAppStore } from '../store/useAppStore';

/* ================================================================
   Font aileleri
   ----------------------------------------------------------------
   Disleksi modunda kullanılan family adları — App.js'de
   Font.useFonts({...}) ile yüklenen isimlerle BİREBİR eşleşmeli.
   ================================================================ */
export const DYSLEXIA_FONTS = Object.freeze({
  regular:    'OpenDyslexic-Regular',
  medium:     'OpenDyslexic-Bold',   // OpenDyslexic'te "medium" yok → bold kullan
  semibold:   'OpenDyslexic-Bold',
  bold:       'OpenDyslexic-Bold',
  italic:     'OpenDyslexic-Italic',
  boldItalic: 'OpenDyslexic-BoldItalic',
});

/**
 * Uygulama genelinde kullanılacak font ailesini döndürür.
 *
 * • dyslexiaFont === true  → OpenDyslexic family adları
 * • dyslexiaFont === false → undefined (Platform varsayılanı)
 *
 * Dönen değer doğrudan Text style içine konabilir:
 *   const font = useAppFont();
 *   <Text style={{ fontFamily: font.regular, ... }}>…</Text>
 */
export function useAppFont() {
  const dyslexiaFont = useAppStore((s) => s.dyslexiaFont) ?? false;

  return useMemo(() => {
    if (!dyslexiaFont) {
      return {
        regular: undefined,
        medium: undefined,
        semibold: undefined,
        bold: undefined,
        italic: undefined,
        boldItalic: undefined,
        isDyslexia: false,
      };
    }
    return { ...DYSLEXIA_FONTS, isDyslexia: true };
  }, [dyslexiaFont]);
}

/**
 * Verilen Text style'ındaki fontWeight/fontStyle'a göre
 * doğru OpenDyslexic varyantını döndürür.
 *
 * AppText wrapper'ı tarafından kullanılır:
 *
 *   const font = useAppFont();
 *   const family = pickFontFamily(style, font);
 *   <Text style={[family && { fontFamily: family }, style]}>{...}</Text>
 *
 * Disleksi kapalıysa `undefined` döner → fontFamily override edilmez,
 * sistem varsayılanı kalır.
 */
export function pickFontFamily(style, font) {
  if (!font?.isDyslexia) return undefined;

  const flat = StyleSheet.flatten(style) || {};
  const weight = flat.fontWeight;

  const isBold =
    weight === 'bold' ||
    weight === '700' ||
    weight === '800' ||
    weight === '900';

  const isItalic = flat.fontStyle === 'italic';

  if (isBold && isItalic) return font.boldItalic;
  if (isBold) return font.bold;
  if (isItalic) return font.italic;
  return font.regular;
}