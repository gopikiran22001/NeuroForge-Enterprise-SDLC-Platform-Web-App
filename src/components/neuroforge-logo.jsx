// NeuroForge logo as an inline React component
// Uses currentColor so it inherits text color from parent
export function NeuroForgeLogo({ className = "size-7" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      className={className}
      aria-label="NeuroForge"
    >
      {/* Hexagon outline */}
      <path
        d="M256 28L462 148V388L256 508L50 388V148L256 28Z"
        stroke="currentColor"
        strokeWidth="36"
        strokeLinejoin="round"
      />
      {/* 3D depth lines */}
      <line x1="256" y1="28" x2="256" y2="142" stroke="currentColor" strokeWidth="36" strokeLinecap="round"/>
      <line x1="50" y1="148" x2="140" y2="200" stroke="currentColor" strokeWidth="36" strokeLinecap="round"/>
      <line x1="462" y1="148" x2="372" y2="200" stroke="currentColor" strokeWidth="36" strokeLinecap="round"/>
      <line x1="256" y1="142" x2="140" y2="200" stroke="currentColor" strokeWidth="36" strokeLinecap="round"/>
      <line x1="256" y1="142" x2="372" y2="200" stroke="currentColor" strokeWidth="36" strokeLinecap="round"/>
      <line x1="140" y1="200" x2="140" y2="388" stroke="currentColor" strokeWidth="36" strokeLinecap="round"/>
      <line x1="372" y1="200" x2="372" y2="388" stroke="currentColor" strokeWidth="36" strokeLinecap="round"/>
      <line x1="140" y1="388" x2="256" y2="508" stroke="currentColor" strokeWidth="36" strokeLinecap="round"/>
      <line x1="372" y1="388" x2="256" y2="508" stroke="currentColor" strokeWidth="36" strokeLinecap="round"/>

      {/* Circuit N nodes */}
      <circle cx="172" cy="185" r="20" fill="currentColor"/>
      <circle cx="318" cy="175" r="20" fill="currentColor"/>
      <circle cx="172" cy="355" r="20" fill="currentColor"/>
      <circle cx="318" cy="345" r="20" fill="currentColor"/>

      {/* N left vertical */}
      <line x1="172" y1="185" x2="172" y2="355" stroke="currentColor" strokeWidth="32" strokeLinecap="round"/>
      {/* N diagonal */}
      <line x1="172" y1="185" x2="318" y2="345" stroke="currentColor" strokeWidth="32" strokeLinecap="round"/>
      {/* N right vertical */}
      <line x1="318" y1="175" x2="318" y2="345" stroke="currentColor" strokeWidth="32" strokeLinecap="round"/>

      {/* Circuit branch top-right */}
      <line x1="318" y1="175" x2="360" y2="175" stroke="currentColor" strokeWidth="20" strokeLinecap="round"/>
      <circle cx="360" cy="175" r="14" fill="currentColor"/>
      <line x1="360" y1="175" x2="360" y2="220" stroke="currentColor" strokeWidth="20" strokeLinecap="round"/>

      {/* Circuit branch bottom-left */}
      <line x1="172" y1="355" x2="140" y2="355" stroke="currentColor" strokeWidth="20" strokeLinecap="round"/>
      <circle cx="140" cy="355" r="14" fill="currentColor"/>
      <line x1="140" y1="355" x2="140" y2="310" stroke="currentColor" strokeWidth="20" strokeLinecap="round"/>
    </svg>
  );
}
