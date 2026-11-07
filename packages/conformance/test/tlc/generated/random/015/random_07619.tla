(*---
description: Evaluates a random bool expression, seed 262, number 7619.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07619 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF (SortSeq(<<>>, LAMBDA p, q : p < q) = (-1 :> 2..1)) THEN (-Head(<<>>)) ELSE (LET b11720 == 2 IN 7 \div (1 % 1)), CASE (({} \subseteq SUBSET {1}) = Len(<<1, 2>>)) -> ([[a |-> 1] EXCEPT !.a = 2147483647]).a [] OTHER -> (IF TRUE THEN 0 ELSE 2 \div (3 * 3))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
