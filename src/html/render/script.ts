export function variantSwitcherCSS(): string {
  return `
.psrt-hidden{display:none!important}
.psrt-variant-hint{position:fixed;z-index:9999;right:12px;bottom:12px;padding:6px 10px;font:12px/1.3 system-ui,sans-serif;color:#e8e8e8;background:rgba(0,0,0,.72);border-radius:6px;pointer-events:none;user-select:none}
`
}

/**
 * Emits a readable, commented variant switcher script.
 * Only call when there are 2+ PSRT variants bundled in the HTML.
 */
export function writeVariantSwitcher(labels: string[]): string {
  if (labels.length < 2) return ''
  const labelsJSON = JSON.stringify(labels)
  return `<div id="psrt-variant-hint" class="psrt-variant-hint" aria-live="polite"></div>
<script>
/**
 * PSRT HTML — variant switcher
 *
 * Bundled PSRT variants share the same page images; only the text/mask
 * overlays differ. Press Ctrl+L to cycle:
 *   variant 0 → variant 1 → … → "Sem PSRT" (hide all overlays) → variant 0 …
 *
 * Each overlay has class psrt-v-N (N = variant index). Inactive overlays
 * use class psrt-hidden (display:none).
 */
(function () {
  /** Human-readable labels shown in the bottom-right hint. */
  var VARIANT_LABELS = ${labelsJSON};

  /** Extra slot at the end: hide all PSRT overlays ("Sem PSRT"). */
  VARIANT_LABELS.push('');

  /** Index into VARIANT_LABELS for the currently visible variant. */
  var activeVariantIndex = 0;

  /** Bottom-right hint element (created above this script). */
  var hintEl = document.getElementById('psrt-variant-hint');

  /**
   * Show one variant index, or hide every overlay when index is the off-state.
   */
  function applyVariant(index) {
    document.querySelectorAll('.psrt-overlay').forEach(function (overlay) {
      overlay.classList.add('psrt-hidden');
    });

    if (index < VARIANT_LABELS.length - 1) {
      document.querySelectorAll('.psrt-overlay.psrt-v-' + index).forEach(function (overlay) {
        overlay.classList.remove('psrt-hidden');
      });
    }

    if (hintEl) {
      var label = VARIANT_LABELS[index];
      hintEl.textContent = label === ''
        ? 'Sem PSRT (Ctrl+L)'
        : label + ' (Ctrl+L)';
    }
  }

  document.addEventListener('keydown', function (event) {
    if (!event.ctrlKey || event.altKey) return;
    if (event.key.toLowerCase() !== 'l') return;
    event.preventDefault();
    activeVariantIndex = (activeVariantIndex + 1) % VARIANT_LABELS.length;
    applyVariant(activeVariantIndex);
  });

  applyVariant(0);
})();
</script>
`
}

export function variantClass(v: number): string {
  return `psrt-v-${v}`
}

export function baseCSS(fontFaces: string): string {
  return `${fontFaces.trim()}
*{box-sizing:border-box;}
.slides-wrap{margin:0;padding:0;display:flex;width:100%;flex-direction:column;align-items:center;}
.slide{position:relative;display:block;flex:0 0 auto;line-height:0;margin:0;padding:0;}
.slide-img{display:block;width:100%;height:auto;margin:0;padding:0;vertical-align:bottom;}
.slide-overlays{position:absolute;left:0;top:0;right:0;bottom:0;}
.slide-overlay{position:absolute;left:0;top:0;right:0;bottom:0;overflow:hidden;container-type:size;container-name:slide;}
.text-layer{position:absolute;box-sizing:border-box;margin:0;padding:0;line-height:1.2;overflow:hidden;overflow-wrap:anywhere;word-wrap:break-word;white-space:pre-wrap;}
.text-ref-img{display:block;max-width:100%;height:auto;margin:0 0 .25em;padding:0;}
`
}

export function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
