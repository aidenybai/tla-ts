(*---
description: Evaluates a random seq expression, seed 262, number 9532.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09532 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(<<Head(Head(<<1>>)), (IF FALSE THEN -1 ELSE 2 + (0 \div 2147483647))>>, Cardinality({b14813 \in UNION {{2, 1, 3}, {2, 1, 3}} : (\E b14814 \in {1} : FALSE)}), (CASE (0 < 1) -> (0 * 3) [] OTHER -> ([a |-> 1]).a \div LET b14815 == Cardinality(Nat) IN Head(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    1
    2283:0 The argument of Head should be a sequence, but instead it is:
    1
---*)
