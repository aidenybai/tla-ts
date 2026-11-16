(*---
description: Evaluates a random bool expression, seed 262, number 3824.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03824 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((2..1 \subseteq Nat) <=> (\A b6029 \in 1..3 : FALSE)) => (~(<<1, 2>> = <<5, 6>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
