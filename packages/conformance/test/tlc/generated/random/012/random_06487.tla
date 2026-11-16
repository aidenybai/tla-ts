(*---
description: Evaluates a random record expression, seed 262, number 6487.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06487 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-Len(SelectSeq(<<1>>, LAMBDA e : e > 0))), b |-> (((0 - 1) .. ([x \in 1..2 |-> x])[0]) = ((1 .. 2) \cap ({x \in 1..3 : x > 1} \cap 2..1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06487 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)
