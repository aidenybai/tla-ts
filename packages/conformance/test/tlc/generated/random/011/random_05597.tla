(*---
description: Evaluates a random bool expression, seed 262, number 5597.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05597 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([a |-> 2, b |-> FALSE] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1]) <=> (({1} \cap {}) = ({1, 2} \ SUBSET {1}))) /\ (Head(Tail(<<>>)) < Cardinality({1 : b8666 \in Nat}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05597 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
