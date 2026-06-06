/* Tweaks для лендинга — управляет CSS-переменными и шрифтами «вживую» */
const { useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "parallax": 6,
  "headFont": "Manrope",
  "bodyFont": "Inter",
  "accent": "#EAA983",
  "radius": 22
}/*EDITMODE-END*/;

const HEAD_FONTS = { "Manrope": "'Manrope', sans-serif", "Onest": "'Onest', sans-serif" };
const BODY_FONTS = { "Inter": "'Inter', sans-serif", "Golos Text": "'Golos Text', sans-serif" };

function TweaksApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const root = document.documentElement;

  useEffect(() => { root.style.setProperty('--parallax', t.parallax); }, [t.parallax]);
  useEffect(() => { root.style.setProperty('--font-head', HEAD_FONTS[t.headFont] || HEAD_FONTS.Manrope); }, [t.headFont]);
  useEffect(() => { root.style.setProperty('--font-body', BODY_FONTS[t.bodyFont] || BODY_FONTS.Inter); }, [t.bodyFont]);
  useEffect(() => {
    root.style.setProperty('--peach', t.accent);
    // подобрать чуть более тёмный оттенок для hover
    root.style.setProperty('--peach-deep', shade(t.accent, -12));
  }, [t.accent]);
  useEffect(() => { root.style.setProperty('--radius', t.radius + 'px'); }, [t.radius]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Анимация" />
      <TweakSlider label="Сила параллакса / появления" value={t.parallax} min={0} max={10} step={1}
        onChange={(v) => setTweak('parallax', v)} />
      <TweakSection label="Типографика" />
      <TweakRadio label="Шрифт заголовков" value={t.headFont} options={["Manrope", "Onest"]}
        onChange={(v) => setTweak('headFont', v)} />
      <TweakRadio label="Шрифт текста" value={t.bodyFont} options={["Inter", "Golos Text"]}
        onChange={(v) => setTweak('bodyFont', v)} />
      <TweakSection label="Акцент и форма" />
      <TweakColor label="Цвет кнопок (CTA)" value={t.accent}
        options={["#EAA983", "#E8A06E", "#D98E6A", "#C2603C"]}
        onChange={(v) => setTweak('accent', v)} />
      <TweakSlider label="Скругление углов" value={t.radius} min={6} max={34} step={2} unit="px"
        onChange={(v) => setTweak('radius', v)} />
    </TweaksPanel>
  );
}

/* затемнить/осветлить hex на процент */
function shade(hex, pct) {
  hex = hex.replace('#', '');
  let r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (c * pct) / 100)));
  const h = (c) => f(c).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<TweaksApp />);
