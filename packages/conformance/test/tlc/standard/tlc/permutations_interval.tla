(*---
description: An interval converts through toSetEnum.
ref: tlc2/module/TLC.java#Permutations
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE permutations_interval ----
EXTENDS TLC, Naturals
Test == <<2, 1, 3>> \in Permutations(1..3)
====

(*--- recorded
all:
  exit: 0
---*)
