(*---
description: Evaluates a random seq expression, seed 262, number 761.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00761 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SortSeq(Append(SubSeq(<<>>, [x \in Nat |-> x + 1], 2147483647), IF TRUE THEN 0 ELSE 0), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    [x \in Nat |-> <expression line 14, col 64 to line 14, col 68 of module random_00761>]
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    [x \in Nat |-> <expression line 14, col 64 to line 14, col 68 of module random_00761>]
---*)
