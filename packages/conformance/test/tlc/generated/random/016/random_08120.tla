(*---
description: Evaluates a random bool expression, seed 262, number 8120.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08120 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((({x \in 1..3 : x > 1} \cap {1, 2}) \ DOMAIN [x \in Nat |-> x + 1]) \subseteq {b12550 \in ({1, 2} \ {x \in 1..3 : x > 1}) : (TRUE \/ FALSE)})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
