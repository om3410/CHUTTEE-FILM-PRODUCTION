import { Clapperboard } from "../../icons";

export function AnimatedLogo({size=28}) {
  return (
    <Clapperboard
      style={{width:size, height: size}}
      className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.55)]"
    />
  );
}