(*---
description: subbag applied to int_one, a IntValue.
ref: tlc2/module/Bags.java#SubBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subbag_int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubBag(1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subbag_int_one failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 106, col 58 to line 106, col 65 of module Bags
---*)
