(*---
description: Evaluates a random function expression, seed 262, number 1061.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01061 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len([Tail(<<1>>) EXCEPT ![1] = Len(<<1, 2>>)]) :> [b1698 \in {(7 % 3) : b1699 \in {0, 2}} |-> CASE (\A b1700 \in {1} : TRUE) -> Cardinality({1}) [] OTHER -> (7 % b1698)]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 22 to line 14, col 32 of module random_01061
    | (0 :> <<1>>)
---*)
