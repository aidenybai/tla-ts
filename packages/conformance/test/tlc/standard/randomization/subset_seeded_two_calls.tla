(*---
description: Consecutive draws advance the generator.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_seeded_two_calls ----
EXTENDS Randomization, FiniteSets, Naturals, TLC
Test == PrintT(<<RandomSubset(2, 1..20), RandomSubset(2, 1..20)>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<{9, 11}, {6, 10}>>"
---*)
