(*---
description: Evaluates a random set expression, seed 262, number 2906.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02906 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN (2 :> 7) \ DOMAIN (-1 :> -1)) \cup (UNION {({1, 2} \cap Nat), ({} \cup 2..1)} \cap DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)
