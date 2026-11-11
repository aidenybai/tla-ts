(*---
description: Evaluates a random bool expression, seed 262, number 845.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00845 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN ([b1379 \in {x \in 1..3 : x > 1} |-> 0] @@ (2 :> 2147483647)) \subseteq ({b1380 \in DOMAIN [x \in 1..2 |-> x] : (FALSE => FALSE)} \ DOMAIN [b1381 \in {1} |-> 0])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
