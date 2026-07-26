export function scaleBrowserPixelValue(value, scale = 0.5) {
  const factor = Number(scale);
  return String(value || "").replace(/(-?(?:\d+\.)?\d+)px\b/g, (match, amount) => {
    const scaled = Number(amount) * factor;
    if (!Number.isFinite(scaled)) {
      return match;
    }
    return `${Number(scaled.toFixed(4))}px`;
  });
}

export function browserDensityPlugin() {
  return {
    postcssPlugin: "nuvio-browser-50-percent-density",
    Once(root) {
      root.walkDecls((decl) => {
        decl.value = scaleBrowserPixelValue(decl.value);
      });
      root.walkAtRules((atRule) => {
        if (atRule.params) {
          atRule.params = scaleBrowserPixelValue(atRule.params);
        }
      });
    }
  };
}

browserDensityPlugin.postcss = true;
