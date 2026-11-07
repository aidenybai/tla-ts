---
"tla-ts": patch
---

Compile specs faster and evaluate them as TLC does. One pass over the definitions computes their levels, effects and read variables, and the evaluator's value caches are gone, so operators and lazy functions evaluate again at each use. With the other changes in this release, checking the 643 corpus models takes 12% more instructions than before the caches were removed (5,293 G to 5,878 G). Some specs get slower, by up to about 4x on `MDBLinearizability` and about 8x on the small `MCParReach`, and some get faster, by about 2x on `FastPaxos`. A check no longer shares TLC's own modules with earlier checks in the process.
