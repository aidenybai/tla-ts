(*---
description: Evaluates a random seq expression, seed 262, number 2471.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02471 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(SortSeq([<<1>> EXCEPT ![1] = 2], LAMBDA p, q : p < q), LAMBDA p, q : p < q) EXCEPT ![1] = (IF (FALSE <=> FALSE) THEN CASE TRUE -> 2 [] OTHER -> 0 ELSE (-SUBSET {1}) % (~(FALSE <=> FALSE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
