(*---
description: With the fixed seed, the drawn subset of a SUBSET repeats exactly.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_seeded_of_subset ----
EXTENDS Randomization, FiniteSets, Naturals, TLC
Test == PrintT(RandomSubset(2, SUBSET (1..3)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{1}, {2, 3}}"
---*)
