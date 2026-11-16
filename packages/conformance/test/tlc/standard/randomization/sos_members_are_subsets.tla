(*---
description: Every pick is a subset of S.
ref: tlc2/module/Randomization.java#RandomSetOfSubsets
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE sos_members_are_subsets ----
EXTENDS Randomization, FiniteSets, Naturals
Test == \A T \in RandomSetOfSubsets(5, 2, 1..6) : T \subseteq 1..6
====

(*--- recorded
all:
  exit: 0
---*)
