(*---
description: Evaluates a random int expression, seed 262, number 749.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00749 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b1229 == ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] EXCEPT !.a = LET b1230 == 2 IN b1230]).a IN (CHOOSE b1231 \in {IF TRUE THEN b1232 ELSE b1232 : b1232 \in ({x \in 1..3 : x > 1} \cap 1..3)} : ((b1231 = b1229) <=> (1 \in {}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
