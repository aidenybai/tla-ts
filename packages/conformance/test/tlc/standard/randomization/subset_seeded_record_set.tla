(*---
description: With the fixed seed, the drawn subset of a record set repeats exactly.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_seeded_record_set ----
EXTENDS Randomization, FiniteSets, Naturals, TLC
Test == PrintT(RandomSubset(2, [a : 1..3, b : 1..3]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[a |-> 1, b |-> 1], [a |-> 2, b |-> 2]}"
---*)
