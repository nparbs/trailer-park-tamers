// Ten street "types". Each drifter has one or two; each move has one.

export type TypeId = 'STREET' | 'BOOZE' | 'CHEM' | 'PSYCHO' | 'TOUGH' | 'SLICK' | 'HOLY' | 'FERAL' | 'SCRAP' | 'STRAPPED';

export const TYPE_INFO: Record<TypeId, { name: string; color: number }> = {
  STREET: { name: 'STREET', color: 0xa8a090 },
  BOOZE: { name: 'BOOZE', color: 0xc0782c },
  CHEM: { name: 'CHEM', color: 0x58b848 },
  PSYCHO: { name: 'PSYCHO', color: 0xb050c0 },
  TOUGH: { name: 'TOUGH', color: 0xa84030 },
  SLICK: { name: 'SLICK', color: 0x4060c0 },
  HOLY: { name: 'HOLY', color: 0xd8c040 },
  FERAL: { name: 'FERAL', color: 0x806040 },
  SCRAP: { name: 'SCRAP', color: 0x7890a0 },
  STRAPPED: { name: 'STRAPPED', color: 0x505058 },
};

// Attacker type -> defender type -> multiplier. Anything missing is 1x.
// Starter triangle: BOOZE beats HOLY (temptation), HOLY beats CHEM (getting saved), CHEM beats BOOZE.
const CHART: Partial<Record<TypeId, Partial<Record<TypeId, number>>>> = {
  STREET: { TOUGH: 0.5 },
  BOOZE: { HOLY: 2, PSYCHO: 2, CHEM: 0.5, BOOZE: 0.5 },
  CHEM: { BOOZE: 2, FERAL: 2, HOLY: 0.5, SCRAP: 0.5 },
  PSYCHO: { SLICK: 2, TOUGH: 2, STRAPPED: 2, HOLY: 0.5, PSYCHO: 0.5 },
  TOUGH: { STREET: 2, SLICK: 2, SCRAP: 2, PSYCHO: 0.5, FERAL: 0.5 },
  SLICK: { HOLY: 2, SCRAP: 2, STRAPPED: 2, PSYCHO: 0.5, SLICK: 0.5 },
  HOLY: { CHEM: 2, FERAL: 2, BOOZE: 0.5, SLICK: 0.5 },
  FERAL: { SLICK: 2, PSYCHO: 2, SCRAP: 0.5, HOLY: 0.5 },
  SCRAP: { FERAL: 2, BOOZE: 2, TOUGH: 0.5, SCRAP: 0.5, STRAPPED: 2 },
  // Guns beat muscle and animals; a fast talker or a lunatic gets the drop on them.
  STRAPPED: { TOUGH: 2, FERAL: 2, STREET: 2, SLICK: 0.5, STRAPPED: 0.5, SCRAP: 0.5 },
};

export function effectiveness(move: TypeId, defender: TypeId[]): number {
  let m = 1;
  for (const d of defender) m *= CHART[move]?.[d] ?? 1;
  return m;
}
