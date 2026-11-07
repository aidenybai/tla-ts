(*---
description: Evaluates a random seq expression, seed 262, number 3486.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03486 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq([SubSeq(<<3, 1, 2>>, 2, 3) EXCEPT ![1] = Cardinality(Nat)], LAMBDA e : e > 0) EXCEPT ![1] = (([[x \in 1..2 |-> x] EXCEPT ![2147483647] = 0])[SortSeq(<<1, 2>>, LAMBDA p, q : p < q)] * ((2147483647 * 2) \div (-1 + 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
