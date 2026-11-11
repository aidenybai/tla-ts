(*---
description: With the fixed seed, the drawn subset of a product repeats exactly.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_seeded_product ----
EXTENDS Randomization, FiniteSets, Naturals, TLC
Test == PrintT(RandomSubset(2, (1..3) \X (1..3)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 1>>, <<2, 2>>}"
---*)
