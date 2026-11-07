(*---
description: Evaluates a random function expression, seed 262, number 830.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00830 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE f \in [{2, 1, 3} -> 1..2] : TRUE) @@ [b1353 \in DOMAIN <<5, 6>> |-> (-7)]) EXCEPT ![LET b1354 == CASE (<<1, 2>> = <<5, 6>>) -> Head(<<>>) [] OTHER -> IF {1, 2} THEN 0 ELSE 0 IN (([a |-> 1, b |-> TRUE]).a - Cardinality(2..1))] = (((-1) \div IF TRUE THEN 7 ELSE 2) % Cardinality(Len(<<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    3
    2181:0 Attempted to compute cardinality of the value
    3
---*)
