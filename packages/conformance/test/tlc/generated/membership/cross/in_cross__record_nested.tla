(*---
description: Asks whether record_nested is in cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfTuplesValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_cross__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]]) \in ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_cross__record_nested failed.
    Attempted to check if non-tuple
    [a |-> [b |-> <<1>>]]
    is in the set of tuples:
    {<<1, 3>>, <<2, 3>>}
---*)
