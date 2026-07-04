// Mascot.jsx
// Simpleng flat-style cartoon mascot, pure SVG — walang kailangang
// external image file. Pwede palitan ang mga colors via props para
// magamit ito sa iba't ibang context (hal. happy mascot sa results
// screen, o iba't ibang character per module).
//
// Kung gusto mo ng mas detalyado/variied na mascots (iba't ibang pose,
// facial expressions, buong character set), doon ka na dapat pumunta sa
// Storyset (storyset.com) o unDraw (undraw.co) — libre silang mag-export
// ng SVG, i-download mo lang at gawing component gamit ang parehong
// pattern na 'to (o direktang i-import as <img src="..."> galing sa
// public/mascots/ folder mo).
//
// Usage:
//   <Mascot size={160} />
//   <Mascot size={100} bodyColor="var(--pink)" headColor="var(--maroon)" />

function Mascot({ size = 160, headColor = 'var(--red)', bodyColor = 'var(--pink)' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      role="img"
      aria-label="ITFun mascot"
    >
      <ellipse cx="80" cy="150" rx="45" ry="8" fill="var(--beige)" />
      <rect x="35" y="45" width="90" height="80" rx="24" fill={bodyColor} stroke="var(--black)" strokeWidth="3" />
      <circle cx="80" cy="35" r="30" fill={headColor} stroke="var(--black)" strokeWidth="3" />
      <circle cx="68" cy="30" r="6" fill="var(--white)" />
      <circle cx="68" cy="30" r="3" fill="var(--black)" />
      <circle cx="92" cy="30" r="6" fill="var(--white)" />
      <circle cx="92" cy="30" r="3" fill="var(--black)" />
      <path d="M68 45 Q80 53 92 45" stroke="var(--black)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="55" y="70" width="18" height="18" rx="4" fill="var(--white)" stroke="var(--black)" strokeWidth="2" />
      <rect x="87" y="70" width="18" height="18" rx="4" fill="var(--white)" stroke="var(--black)" strokeWidth="2" />
      <circle cx="64" cy="79" r="3" fill="var(--maroon)" />
      <circle cx="96" cy="79" r="3" fill="var(--maroon)" />
      <rect x="20" y="55" width="14" height="35" rx="7" fill={bodyColor} stroke="var(--black)" strokeWidth="3" />
      <rect x="126" y="55" width="14" height="35" rx="7" fill={bodyColor} stroke="var(--black)" strokeWidth="3" />
    </svg>
  );
}

export default Mascot;