(*---
description: With the fixed seed, the picks repeat exactly, printed normalized.
ref: tlc2/module/Randomization.java#RandomSetOfSubsets
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE sos_seeded ----
EXTENDS Randomization, FiniteSets, Naturals, TLC
Test == PrintT(RandomSetOfSubsets(4, 2, 1..6))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{1, 2}, {3, 6}, {4, 5}, {5, 6}}"
---*)
