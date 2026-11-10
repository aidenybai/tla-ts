(*---
description: Evaluates a random int expression, seed 262, number 4930.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04930 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b7664 \in (\A b7665 \in ({} \cap 1..3) : ({1} \subseteq SUBSET {1})) |-> ((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \ {1}] : TRUE))[IF TRUE THEN b7664 ELSE 2]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
