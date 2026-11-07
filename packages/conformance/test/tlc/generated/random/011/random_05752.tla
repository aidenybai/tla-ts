(*---
description: Evaluates a random record expression, seed 262, number 5752.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05752 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = @ + 3] EXCEPT !.a = Head(<<3, 1, 2>>)] EXCEPT !.a = @ + Cardinality(({1, 2} \cap {x \in 1..3 : x > 1}))] EXCEPT !.a = @ + (Cardinality({b8855 \in 2..1 : FALSE}) - ([b8856 \in 2..1 |-> b8856])[[[x \in 1..2 |-> x] EXCEPT ![2147483647] = 1]])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 236 to line 14, col 253 of module random_05752
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05752 failed.
    In applying the function
    <<>>,
    the first argument is:
    <<1, 2>>
    which is not in its domain.
---*)
