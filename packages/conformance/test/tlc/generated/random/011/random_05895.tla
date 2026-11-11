(*---
description: Evaluates a random set expression, seed 262, number 5895.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05895 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b9093 \in ({2, 7} \cap (1..3 \ 2..1)) |-> (-(b9093 - 1))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)
