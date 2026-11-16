(*---
description: With the fixed seed, the picks repeat exactly.
ref: tlc2/module/Randomization.java#RandomSubsetSet
features:
  - Randomization
flags:
  - expression
outcome: success
includes:
  - Randomization.tla
---*)
---- MODULE sss_seeded ----
EXTENDS Randomization, FiniteSets, Naturals, TLC
Test == PrintT(RandomSubsetSet(4, "0.5", 1..6))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{1, 2}, {3, 6}, {4, 5}, {5, 6}}"
---*)
