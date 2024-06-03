//=============================================================================
// This file stores functions we use to serve dynamic CSS animations.
// These animation functions work in tandem with static tailwind to cleanly
// separate concerns and simplify component syntax.
//=============================================================================

export function getDelayClass(index: number):number {
  return index * 60;
}

export function spineSlideUp(index: number, loaded: boolean) {
    return index * 60;
  }

export function spineExpand(index: number, expanded: boolean, accentColor: string) {
  return {
    width: expanded ? "32vh" : `6.25vw`,
    "background-color": accentColor,
    "animation-delay": `${getDelayClass(index)}ms`,
    transition:
    "width 0.4s ease-in-out 0.2s, margin-top 0.4s ease-in-out",
  };
}