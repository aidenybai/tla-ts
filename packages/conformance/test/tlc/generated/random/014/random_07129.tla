(*---
description: Evaluates a random int expression, seed 262, number 7129.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07129 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (\E b10947 \in SUBSET {1} : TRUE) THEN ([a |-> 1, b |-> TRUE]).a ELSE (-0) * ((~TRUE) \div IF FALSE THEN 2147483647 ELSE 3)) * Head(<<IF TRUE THEN 2147483647 ELSE 2147483647, Cardinality({x \in 1..3 : x > 1})>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2147483647"
---*)
