(*---
description: A base set larger than 31 elements stays in the first exponent check's shortcut.
ref: tlc2/module/Randomization.java#RandomSetOfSubsets
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE sos_seeded_large_base ----
EXTENDS Randomization, FiniteSets, Naturals, TLC
Test == PrintT(Cardinality(RandomSetOfSubsets(3, 16, 1..32)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
