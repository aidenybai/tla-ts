(*---
description: Asks whether subset is in nat, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_nat__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \in (Nat))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_nat__subset failed.
    2158:0 Attempted to check if the value:
    {{}, {1}, {2}, {1, 2}}
    is an element of Nat.
---*)
