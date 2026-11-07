(*---
description: Evaluates a random set expression, seed 262, number 9748.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09748 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![[a |-> 1]] = -1] \cup ({3, 1} \cap (0 .. 7))), DOMAIN ((-1 * 7) :> Cardinality({1, 2}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    [a |-> 1]
    is an element of Nat.
    2158:0 Attempted to check if the value:
    [a |-> 1]
    is an element of Nat.
---*)
