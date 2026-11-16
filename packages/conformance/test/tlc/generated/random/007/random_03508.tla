(*---
description: Evaluates a random bool expression, seed 262, number 3508.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03508 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((({1, 2} \ {1}) \ {b5543 \in {1} : FALSE}) = {(1 - 2147483647), IF FALSE THEN TRUE ELSE 3})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
