(*---
description: Evaluates a random function expression, seed 262, number 6131.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06131 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9429 \in ((CASE FALSE -> -1 [] OTHER -> 0 .. ([a |-> 1]).a) \cap {b9430 \in UNION {{1, 2}, {1, 2}} : (~FALSE)}) |-> Len(SelectSeq(SortSeq([a |-> 1], LAMBDA p, q : p < q), LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06131 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> 1]
---*)
