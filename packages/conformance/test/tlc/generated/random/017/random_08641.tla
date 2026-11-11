(*---
description: Evaluates a random bool expression, seed 262, number 8641.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08641 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b13374 \in [[[a |-> 7, b |-> TRUE] EXCEPT !.a = @ + IF TRUE THEN 3 ELSE 2] EXCEPT !.a = @ + ([b13375 \in {1} |-> b13375])[Cardinality({})]] : (Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) < ((b13374 % (1 :> 2)) - ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08641 failed.
    In applying the function
    <<1>>,
    the first argument is:
    0
    which is not in its domain.
---*)
