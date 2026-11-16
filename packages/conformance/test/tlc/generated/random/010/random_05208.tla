(*---
description: Evaluates a random bool expression, seed 262, number 5208.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05208 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a < LET b8081 == (IF TRUE THEN <<>> ELSE 0 - Cardinality([a |-> 1, b |-> TRUE])) IN Cardinality(({x \in 1..3 : x > 1} \cup {1, 2}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
