(*---
description: Evaluates a random function expression, seed 262, number 468.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00468 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b772 \in ((7 .. 3) \cap {b773 : b773 \in 2..1}) |-> (IF TRUE THEN b772 ELSE b772 \div Head(<<1, 2>>))] @@ (Head(SortSeq(<<1>>, LAMBDA p, q : p < q)) % (-Len(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00468 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -3
---*)
