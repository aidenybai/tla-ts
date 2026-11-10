(*---
description: Evaluates a random seq expression, seed 262, number 5263.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05263 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([Append([<<1, 2>> EXCEPT ![1] = -1], ([a |-> 1, b |-> TRUE]).a) EXCEPT ![1] = IF (1 < 1) THEN LET b8145 == 7 IN 1 ELSE (3 + 0)], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, 3>>"
---*)
