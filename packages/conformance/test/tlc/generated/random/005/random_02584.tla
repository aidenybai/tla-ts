(*---
description: Evaluates a random int expression, seed 262, number 2584.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02584 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (([a |-> 2147483647, b |-> <<1, 2>>]).a = ([a |-> 3, b |-> FALSE]).a) -> LET b4069 == [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] EXCEPT !.a = ([a |-> 1, b |-> TRUE]).a] IN IF [b4070 \in 1..3 |-> 2] THEN IF TRUE THEN 1 ELSE b4069 ELSE LET b4071 == -1 IN -1 [] OTHER -> Len(SelectSeq([<<3, 1, 2>> EXCEPT ![1] = 3], LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
