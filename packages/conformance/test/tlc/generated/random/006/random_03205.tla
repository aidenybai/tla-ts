(*---
description: Evaluates a random seq expression, seed 262, number 3205.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03205 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SelectSeq(Append(SubSeq(<<>>, 2, [x \in 1..2 |-> x]), IF FALSE THEN 0 ELSE <<>>), LAMBDA e : e > 0), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03205 failed.
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    <<1, 2>>
---*)
