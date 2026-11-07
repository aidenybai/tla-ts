(*---
description: Evaluates a random bool expression, seed 262, number 5665.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05665 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2 - 0) * CASE TRUE -> 7 [] OTHER -> 2147483647) \div Len(SubSeq(<<3, 1, 2>>, 0, -1))) = (((0 * 1) + Head(<<1>>)) * (CHOOSE b8741 \in {-1 : b8742 \in Nat} : (SUBSET {1} \ SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
