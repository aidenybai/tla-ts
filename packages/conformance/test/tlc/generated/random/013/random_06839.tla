(*---
description: Evaluates a random set expression, seed 262, number 6839.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06839 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b10479 \in DOMAIN (CHOOSE f \in [2..1 -> {1, 2}] : TRUE) : ((({1} \cap {2, 1, 3}) \subseteq ({} \cap {x \in 1..3 : x > 1})) => ((TRUE <=> FALSE) <=> (FALSE \/ FALSE)))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
