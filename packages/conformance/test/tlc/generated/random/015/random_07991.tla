(*---
description: Evaluates a random int expression, seed 262, number 7991.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07991 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((((0 .. -1) \cap (CHOOSE r \in [a : {1}] : TRUE)) \cap ((SUBSET {1} \cup {2, 1, 3}) \cup ({} \cup Nat)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
