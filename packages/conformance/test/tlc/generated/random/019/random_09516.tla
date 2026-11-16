(*---
description: Evaluates a random bool expression, seed 262, number 9516.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09516 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(<<(-3), [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]>>) = (LET b14782 == CASE TRUE -> 0 [] OTHER -> 2147483647 IN IF FALSE THEN <<3, 1, 2>> ELSE 0 \div Head(SelectSeq(<<1>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
