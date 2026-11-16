(*---
description: With the fixed seed, the drawn subset of an enumerated set repeats exactly.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_seeded_set ----
EXTENDS Randomization, FiniteSets, Naturals, TLC
Test == PrintT(RandomSubset(2, {"a", "b", "c", "d", "e"}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| {"b", "e"}'
---*)
