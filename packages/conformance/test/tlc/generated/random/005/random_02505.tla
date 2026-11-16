(*---
description: Evaluates a random set expression, seed 262, number 2505.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02505 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (LET b3945 == IF TRUE THEN 2147483647 ELSE -1 IN (-b3945) :> [[a |-> 1, b |-> FALSE] EXCEPT !.a = @ + (2147483647 \div 3)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-2147483647}"
---*)
