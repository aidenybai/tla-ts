(*---
description: Evaluates a random int expression, seed 262, number 6064.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06064 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {1}] : TRUE)).a \div (-(-IF TRUE THEN 7 ELSE -1))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
