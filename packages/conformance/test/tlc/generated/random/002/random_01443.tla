(*---
description: Evaluates a random set expression, seed 262, number 1443.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01443 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<>>) .. ([x \in 1..2 |-> x])[2147483647]) \cap {Head(<<1, 2>>), Cardinality(Nat)}) \ (([[a |-> 1] EXCEPT !.a = 1]).a .. Len(<<2147483647, FALSE>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
