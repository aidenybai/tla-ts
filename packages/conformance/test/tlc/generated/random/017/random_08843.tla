(*---
description: Evaluates a random set expression, seed 262, number 8843.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08843 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(Tail((\A b13689 \in SUBSET {1} : FALSE))) : b13688 \in (([1 EXCEPT !.a = [x \in 1..2 |-> x]]).a .. LET b13690 == (-2147483647) IN LET b13691 == <<3, 1, 2>> IN b13691)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08843 failed.
    Attempted to apply EXCEPT construct to the value 1.
---*)
