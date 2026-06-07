export const VIBES_QUESTIONS = [
  { id: "pets",   a: "🐱 Cats",           b: "🐶 Dogs"         },
  { id: "drink",  a: "☕ Coffee",          b: "🍵 Tea"          },
  { id: "time",   a: "☀️ Early bird",      b: "🌙 Night owl"    },
  { id: "nature", a: "🏖️ Beach",           b: "🏔️ Mountains"    },
  { id: "focus",  a: "🎧 Headphones in",   b: "🔇 Silence"      },
  { id: "pizza",  a: "🍕 Pineapple yes",   b: "🚫 Pineapple no" },
  { id: "mode",   a: "🌙 Dark mode",       b: "☀️ Light mode"   },
  { id: "pixar",  a: "🥲 Cried at Pixar",  b: "🙅 Never cried"  },
]

export function toggleVibe(
  prev: string[],
  answer: string,
  q: (typeof VIBES_QUESTIONS)[number],
): string[] {
  const without = prev.filter((v) => v !== q.a && v !== q.b)
  return prev.includes(answer) ? without : [...without, answer]
}
