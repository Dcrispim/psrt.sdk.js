// Canonical property name constants (camelCase).
export const KeyPosition = 'position'
export const KeyLeft = 'left'
export const KeyTop = 'top'
export const KeyWidth = 'width'
export const KeyHeight = 'height'
export const KeyBoxSizing = 'boxSizing'
export const KeyPadding = 'padding'
export const KeyPaddingTop = 'paddingTop'
export const KeyPaddingRight = 'paddingRight'
export const KeyPaddingBottom = 'paddingBottom'
export const KeyPaddingLeft = 'paddingLeft'

export const KeyBorder = 'border'
export const KeyBorderTop = 'borderTop'
export const KeyBorderRight = 'borderRight'
export const KeyBorderBottom = 'borderBottom'
export const KeyBorderLeft = 'borderLeft'
export const KeyBorderWidth = 'borderWidth'
export const KeyBorderStyle = 'borderStyle'
export const KeyBorderColor = 'borderColor'

export const KeyBorderRadius = 'borderRadius'
export const KeyBorderTopLeftRadius = 'borderTopLeftRadius'
export const KeyBorderTopRightRadius = 'borderTopRightRadius'
export const KeyBorderBottomRightRadius = 'borderBottomRightRadius'
export const KeyBorderBottomLeftRadius = 'borderBottomLeftRadius'

export const KeyBoxShadow = 'boxShadow'
export const KeyTextShadow = 'textShadow'
export const KeyGlow = 'glow'
export const KeyBevel = 'bevel'
export const KeyBlur = 'blur'
export const KeyBlurLeft = 'blurLeft'
export const KeyBlurRight = 'blurRight'
export const KeyBlurTop = 'blurTop'
export const KeyBlurBottom = 'blurBottom'

export const KeyBackground = 'background'
export const KeyColor = 'color'

export const KeyTextAlign = 'textAlign'
export const KeyAlignItems = 'alignItems'
export const KeyTextDecoration = 'textDecoration'
export const KeyTextDecorationLine = 'textDecorationLine'
export const KeyLetterSpacing = 'letterSpacing'
export const KeyLineHeight = 'lineHeight'
export const KeyWordSpacing = 'wordSpacing'
export const KeyWhiteSpace = 'whiteSpace'
export const KeyTextTransform = 'textTransform'
export const KeyTextIndent = 'textIndent'
export const KeyTextOverflow = 'textOverflow'
export const KeyOpacity = 'opacity'

export const KeyStroke = 'stroke'
export const KeyStrokeWidth = 'strokeWidth'
export const KeyStrokeColor = 'strokeColor'

export const KeyTransform = 'transform'
export const KeyTransformOrigin = 'transformOrigin'
export const KeyTranslate = 'translate'
export const KeyRotate = 'rotate'
export const KeyScale = 'scale'
export const KeySkew = 'skew'
export const KeyMatrix = 'matrix'

export const KeyFontFamily = 'fontFamily'
export const KeyFontSize = 'fontSize'
export const KeyFontWeight = 'fontWeight'
export const KeyFontStyle = 'fontStyle'
export const KeyFontVariant = 'fontVariant'
export const KeyFontStretch = 'fontStretch'

const boxKeys = new Set<string>([
  KeyHeight,
  KeyBackground,
  KeyPadding,
  KeyPaddingTop,
  KeyPaddingRight,
  KeyPaddingBottom,
  KeyPaddingLeft,
  KeyBorder,
  KeyBorderTop,
  KeyBorderRight,
  KeyBorderBottom,
  KeyBorderLeft,
  KeyBorderWidth,
  KeyBorderStyle,
  KeyBorderColor,
  KeyBorderRadius,
  KeyBorderTopLeftRadius,
  KeyBorderTopRightRadius,
  KeyBorderBottomRightRadius,
  KeyBorderBottomLeftRadius,
  KeyBoxShadow,
  KeyGlow,
  KeyBevel,
  KeyBlur,
  KeyBlurLeft,
  KeyBlurRight,
  KeyBlurTop,
  KeyBlurBottom,
])

const textKeys = new Set<string>([
  KeyColor,
  KeyTextAlign,
  KeyAlignItems,
  KeyTextDecoration,
  KeyTextDecorationLine,
  KeyLetterSpacing,
  KeyLineHeight,
  KeyWordSpacing,
  KeyWhiteSpace,
  KeyTextTransform,
  KeyTextIndent,
  KeyTextOverflow,
  KeyOpacity,
  KeyTextShadow,
  KeyStroke,
  KeyStrokeWidth,
  KeyStrokeColor,
  KeyFontFamily,
  KeyFontSize,
  KeyFontWeight,
  KeyFontStyle,
  KeyFontVariant,
  KeyFontStretch,
])

const transformKeys = new Set<string>([
  KeyTransform,
  KeyTransformOrigin,
  KeyTranslate,
  KeyRotate,
  KeyScale,
  KeySkew,
  KeyMatrix,
])

export function isBoxKey(key: string): boolean {
  return boxKeys.has(key)
}

export function isTextKey(key: string): boolean {
  return textKeys.has(key)
}

export function isTransformKey(key: string): boolean {
  return transformKeys.has(key)
}
