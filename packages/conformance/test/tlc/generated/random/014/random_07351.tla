(*---
description: Evaluates a random set expression, seed 262, number 7351.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07351 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (2 - 7), b |-> ({1} \ 2..1)] EXCEPT !.a = (CASE TRUE -> 3 [] OTHER -> 2147483647 \div (3 - [a |-> 1]))] EXCEPT !.a = Head(Append(SelectSeq(<<>>, LAMBDA e : e > 0), IF TRUE THEN 0 ELSE <<3, 1, 2>>))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0, b |-> {1}]"
---*)
