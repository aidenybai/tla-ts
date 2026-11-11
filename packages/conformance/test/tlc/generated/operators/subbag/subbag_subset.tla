(*---
description: subbag applied to subset, a SubsetValue.
ref: tlc2/module/Bags.java#SubBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subbag_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubBag(SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subbag_subset failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a set of the form SUBSET S)
    line 106, col 58 to line 106, col 65 of module Bags
---*)
