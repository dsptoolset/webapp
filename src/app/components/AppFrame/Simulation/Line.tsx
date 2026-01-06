export function Line({ from, to, color = "black", width = 2 }) {
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={color}
      strokeWidth={width}
    />
  );
}
