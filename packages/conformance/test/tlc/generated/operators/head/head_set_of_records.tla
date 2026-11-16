(*---
description: head applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module head_set_of_records failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    {[a |-> 1], [a |-> 2]}
---*)
