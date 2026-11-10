(*---
description: Evaluates a random set expression, seed 262, number 6582.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06582 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (((7 - 2147483647) :> (CHOOSE b10109 \in SUBSET {1} : TRUE)) @@ (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-2147483640, 2}"
---*)
