// My Virtual World — Copyright (c) 2026 My Virtual World. Licensed under the PolyForm Noncommercial License 1.0.0 (see LICENSE).
// The text patterns every dictionary shares (text with a number or a name in it), filled with one language's words.
// p: { days: { Mon … Sun }, day: 'Day $1', paused, inside: '$1 …', visitors: '$1 …', agents: '… · $1',
//      transparency: '…: $1%', emoji: '…: $1', language: '…: $1' }

export function makePatterns(p) {
  return [
    [/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) · day (\d+)( · paused)?$/, (_, d, n, z) => `${p.days[d]} · ${p.day.replace('$1', n)}${z ? ` · ${p.paused}` : ''}`],
    [/^(\d+) (person|people) inside now$/, p.inside],
    [/^(\d+) visitors? right now$/, p.visitors],
    [/^Agents · (\d+)$/, p.agents],
    [/^Transparency: (\d+)%$/, p.transparency],
    [/^Agents' emoji: (.+)$/, p.emoji],
    [/^Language: (.+)$/, p.language],
  ];
}
