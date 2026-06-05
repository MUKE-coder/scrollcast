/**
 * Load both themes' web fonts via @remotion/google-fonts. Idempotent —
 * `loadFont` dedupes internally, so importing this once at the top of
 * `Root.tsx` is enough. Loading both themes always (vs. only the active
 * one) keeps theme switching instant in Studio with no render flash.
 *
 * SF Pro is Apple-proprietary and not on Google Fonts — Inter is the
 * documented fallback; SF Pro is preserved at the top of the CSS
 * fontFamily stack for systems that happen to have it installed.
 */

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

const TYPE_WEIGHTS = ["400", "500", "600", "700"] as const;

loadGeist("normal", { weights: [...TYPE_WEIGHTS] });
loadInter("normal", { weights: [...TYPE_WEIGHTS] });
loadGeistMono("normal", { weights: ["400", "500"] });
loadJetBrainsMono("normal", { weights: ["400", "500"] });
