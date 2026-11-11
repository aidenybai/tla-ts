(*---
description: Evaluates a random seq expression, seed 262, number 5009.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05009 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] EXCEPT !.a = SortSeq(<<1>>, LAMBDA p, q : p < q)])[(Cardinality({x \in 1..3 : x > 1}) * LET b7792 == 0 IN b7792)], ([a |-> CASE TRUE -> 2147483647 [] OTHER -> 7, b |-> (~FALSE)]).a>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05009 failed.
    Attempted to access record by a non-string argument: 0
---*)
