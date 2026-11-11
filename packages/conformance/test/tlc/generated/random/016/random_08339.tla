(*---
description: Evaluates a random set expression, seed 262, number 8339.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08339 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head([<<b12897, -1>> EXCEPT ![1] = (CHOOSE b12898 \in 2..1 : TRUE)]) : b12897 \in DOMAIN (CHOOSE f \in [{} -> 1..2] : TRUE)})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
