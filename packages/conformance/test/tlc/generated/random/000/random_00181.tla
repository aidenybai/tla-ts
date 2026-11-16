(*---
description: Evaluates a random bool expression, seed 262, number 181.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00181 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(\A b288 \in (DOMAIN <<5, 6>> \ {b289 \in {1, 2} : TRUE}) : (Head(1) = (2 + b288)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
