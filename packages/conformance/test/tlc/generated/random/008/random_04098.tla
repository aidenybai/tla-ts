(*---
description: Evaluates a random bool expression, seed 262, number 4098.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04098 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {1, 2}] : TRUE)).a \in ({(1 + 3), LET b6441 == 3 IN 0} \ DOMAIN [b6442 \in 1..3 |-> b6442])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
