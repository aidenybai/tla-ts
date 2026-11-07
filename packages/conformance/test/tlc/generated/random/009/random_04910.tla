(*---
description: Evaluates a random int expression, seed 262, number 4910.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04910 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({(CASE FALSE -> 2 [] OTHER -> 1 + IF TRUE THEN 2 ELSE 3), Cardinality([a |-> {}, b |-> TRUE])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    [a |-> {}, b |-> TRUE]
    2181:0 Attempted to compute cardinality of the value
    [a |-> {}, b |-> TRUE]
---*)
