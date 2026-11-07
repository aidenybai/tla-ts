(*---
description: Evaluates a random int expression, seed 262, number 5578.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05578 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SubSeq(SortSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA p, q : p < q), LET b8636 == Cardinality({x \in 1..3 : x > 1}) IN Cardinality({1, 2}), ([[x \in Nat |-> x + 1] EXCEPT !.a = @ + 2]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
---*)
