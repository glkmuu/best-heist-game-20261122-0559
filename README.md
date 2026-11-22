# THE SCARLET VAULT

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/glkmuu/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/glkmuu/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A casino heist in three floors. You are the thief in the black suit and the
red scarf. Steal every glowing loot target — gold bars, chip stacks, the
diamond — dodge patrol guards and their vision cones, slip past sweeping
cameras and laser tripwires, and reach the GETAWAY VAN before the alarm
hits 100%.

## Floors

1. **CASINO FLOOR** — roulette, blackjack and poker tables for cover; a
   labelled VENT route and SHADOW zones give two ways to every loot target.
2. **VAULT FLOOR** — laser grids guard the gold; EMP kills the cameras.
3. **PENTHOUSE** — a guard dog hears running feet. Sneak, or pay for it.

## Tools (prices on the HUD)

- **Q — coin, FREE**: toss it and nearby guards walk over to investigate.
- **F — smoke, 150 pts**: a cloud that blocks all vision for 6 seconds.
- **E — EMP, 300 pts**: every camera OFFLINE for 8 seconds.
- **G — disguise, 250 pts**: guards ignore you for 8 seconds.

## Rules

- **WASD / arrows** move, **Shift** sneaks (slower, quieter, harder to spot
  in shadow). **R** restarts the floor. **Enter** starts / continues.
- Guards and cameras fill suspicion while they see you — about 2.5 seconds
  of full exposure trips the alarm. Alarm 100% costs a life; 3 lives.
- The exit stays locked until every loot target on the floor is stolen.
- Finish a floor never spotted for the **GHOST bonus** (+1000) and up to
  3 stars on the getaway screen.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Static files only — no build step, no network requests. Original art, code
and sounds, made for the make.fun best-heist-game bounty.
