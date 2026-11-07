(*---
description: Evaluates a random function expression, seed 262, number 4939.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04939 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b7686 == IF (7 = (1 :> 2)) THEN (-1 * 2147483647) ELSE (2 + 7) IN (CASE TRUE -> -1 [] OTHER -> b7686 + Len(<<3, 1, 2>>)) :> (-(IF FALSE THEN 2147483647 ELSE 1 + Head(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-1 :> -4)"
---*)
