(*---
description: Evaluates a random int expression, seed 262, number 3949.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03949 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({b6213 \in [[a |-> 7, b |-> FALSE] EXCEPT !.a = @ + (2147483647 - 3)] : ((Nat \subseteq Nat) /\ ([a |-> 1, b |-> TRUE] = [a |-> 1]))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03949 failed.
    2178:0 Overflow when computing 7+2147483644
---*)
