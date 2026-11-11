(*---
description: Evaluates a random set expression, seed 262, number 6382.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06382 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(<<IF TRUE THEN 0 ELSE 0, (CHOOSE f \in [1..2 -> {1, 2}] : TRUE)>>, LAMBDA e : e > 0), Cardinality({(-3), (7 * 2)}), (([<<>> EXCEPT ![1] = 2] \o (TRUE \/ TRUE)) % (-(3 + 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06382 failed.
    2266:0 The first argument of > should be an integer, but instead it is:
    <<1, 1>>
---*)
