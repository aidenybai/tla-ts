(*---
description: With the fixed seed, the drawn subset of an interval repeats exactly.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_seeded_interval ----
EXTENDS Randomization, FiniteSets, Naturals, TLC
Test == PrintT(RandomSubset(3, 1..20))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {9, 11, 18}"
---*)
