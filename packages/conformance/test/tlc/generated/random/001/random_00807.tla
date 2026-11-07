(*---
description: Evaluates a random function expression, seed 262, number 807.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00807 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((IF TRUE THEN 2147483647 ELSE -1 :> (2 * 2)) @@ [b1319 \in UNION {{x \in 1..3 : x > 1}, 2..1} |-> (-7)]) EXCEPT ![(LET b1320 == (2147483647 % 2147483647) IN Len(<<3, 1, 2>>) .. Head(SubSeq(<<3, 1, 2>>, -1, FALSE)))] = (((0 * 1) :> LET b1321 == (1 :> 2) IN b1321))[Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    2147483647
    2169:0 The first argument of @@ should be a function, but instead it is:
    2147483647
---*)
