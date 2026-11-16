(*---
description: subbag applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/Bags.java#SubBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subbag_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubBag([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subbag_set_of_functions failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a set of the form [S -> T])
    line 106, col 58 to line 106, col 65 of module Bags
---*)
