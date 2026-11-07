(*---
description: Evaluates a random set expression, seed 262, number 4947.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04947 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (CHOOSE f \in [{} -> {0} \cup {1}] : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
