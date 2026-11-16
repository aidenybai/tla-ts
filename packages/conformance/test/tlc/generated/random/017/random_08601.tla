(*---
description: Evaluates a random set expression, seed 262, number 8601.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08601 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN (CHOOSE f \in [{1, 2} \ {1} -> {1}] : TRUE), ({(2 \div 7), [b13323 \in {2, 1, 3} |-> b13323]} \cap (({2, 1, 3} \ Nat) \cap ({2, 1, 3} \cap {})))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)
