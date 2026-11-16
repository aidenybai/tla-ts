(*---
description: Evaluates a random record expression, seed 262, number 9604.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09604 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[Cardinality((2..1 \cup Nat)) EXCEPT !.a = @ + (CHOOSE b14911 \in {b14912 \in 2..1 : FALSE} : (2147483647 < -1))] EXCEPT !.a = Len(SortSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09604 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
