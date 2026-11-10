(*---
description: Evaluates a random set expression, seed 262, number 6995.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06995 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![{1}] = 3] \cup ({7, 7} \cup [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2])) \cap {b10714 \in {(1 + SUBSET {1}) : b10715 \in (2147483647 .. 2)} : ([b10716 \in Nat |-> 1] = ([a |-> 1, b |-> TRUE]).a)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06995 failed.
    2158:0 Attempted to check if the value:
    {1}
    is an element of Nat.
---*)
