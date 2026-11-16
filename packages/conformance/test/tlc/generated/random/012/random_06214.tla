(*---
description: Evaluates a random record expression, seed 262, number 6214.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06214 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE))[((-1 * 7) * IF FALSE THEN 2 ELSE -1)], b |-> (Tail(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) = (~(<<1, 2>> = [x \in Nat |-> x + 1])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06214 failed.
    Attempted to apply function:
    <<1, 1>>
    to argument 7, which is not in the domain of the function.
---*)
