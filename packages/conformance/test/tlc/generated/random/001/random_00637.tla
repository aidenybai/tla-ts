(*---
description: Evaluates a random function expression, seed 262, number 637.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00637 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1062 \in ((UNION {1..3, 1..3} \cap {b1063 \in 1..3 : FALSE}) \ ((1..3 \cap {1, 2}) \ UNION {{2, 1, 3}, {x \in 1..3 : x > 1}})) |-> LET b1064 == DOMAIN (CHOOSE r \in [a : {2, 1, 3}] : TRUE) IN ((b1062 \div 2) \div ([a |-> 1]).a)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
