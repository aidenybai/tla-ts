(*---
description: Evaluates a random set expression, seed 262, number 1135.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01135 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN (CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE), {Cardinality(({1} \cup {2, 1, 3})) : b1818 \in DOMAIN (7 :> 1)}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {3}"
---*)
