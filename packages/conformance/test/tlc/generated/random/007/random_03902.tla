(*---
description: Evaluates a random record expression, seed 262, number 3902.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03902 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head(SortSeq(<<>>, LAMBDA p, q : p < q)), b |-> ((<<1>> = [x \in 1..2 |-> x]) /\ (7 = 2147483647))] EXCEPT !.a = Cardinality({LET b6146 == 3 IN 7, ([a |-> 1]).a})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03902 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
