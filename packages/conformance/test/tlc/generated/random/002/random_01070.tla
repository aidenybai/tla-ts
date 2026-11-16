(*---
description: Evaluates a random record expression, seed 262, number 1070.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01070 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail([[[a |-> 1] EXCEPT !.a = @ + -1] EXCEPT ![1] = (1 * 0)]), (-IF (TRUE \/ FALSE) THEN (-1 + 2147483647) ELSE Head(<<1>>)), (Len(SortSeq(<<1>>, LAMBDA p, q : p < q)) + (Cardinality({x \in 1..3 : x > 1}) + DOMAIN (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01070 failed.
    Attempted to access record by a non-string argument: 1
---*)
