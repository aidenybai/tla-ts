(*---
description: Asks whether function_empty is in set_cup, a SetCupValue.
ref: tlc2/value/impl/SetCupValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_cup__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) \in ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_set_cup__function_empty failed.
    Attempted to check equality of integer 1 with non-integer:
    <<>>
---*)
