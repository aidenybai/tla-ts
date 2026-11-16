(*---
description: Evaluates a random int expression, seed 262, number 3380.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03380 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(UNION {{IF FALSE THEN 3 ELSE 2147483647 : b5365 \in {7 : b5366 \in {1}}}, UNION {DOMAIN [x \in 1..2 |-> x], (1..3 \cap {1, 2})}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
