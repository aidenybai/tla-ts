(*---
description: Evaluates a random seq expression, seed 262, number 3061.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03061 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(Append(<<1, 7>>, (2147483647 % 0)), (-IF FALSE THEN 0 ELSE 1)), (Cardinality({0 : b4861 \in {x \in 1..3 : x > 1}}) * CASE (TRUE \/ FALSE) -> Cardinality(SUBSET {1}) [] OTHER -> Append(<<3, 1, 2>>, -1)), Len((IF TRUE THEN 7 ELSE 1 + (-1 * 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
