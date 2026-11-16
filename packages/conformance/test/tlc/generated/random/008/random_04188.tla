(*---
description: Evaluates a random bool expression, seed 262, number 4188.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04188 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((<<-1, -1>> = (0 :> 2)) => (\E b6588 \in DOMAIN [x \in Nat |-> x + 1] : (1 \in 1..3)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
