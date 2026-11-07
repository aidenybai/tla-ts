(*---
description: Evaluates a random function expression, seed 262, number 1858.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01858 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b2931 \in ({(CHOOSE b2932 \in {2, 1, 3} : TRUE), ([a |-> 1, b |-> TRUE]).a} \ (Cardinality([x \in 1..2 |-> x]) .. (2 \div 2147483647))) |-> IF (([a |-> 1, b |-> TRUE] - b2931) = (-b2931)) THEN ((1..3 \ {1}) \cup UNION {{x \in 1..3 : x > 1}, 3}) ELSE (-([x \in Nat |-> x + 1])[b2931])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<1, 2>>
    2181:0 Attempted to compute cardinality of the value
    <<1, 2>>
---*)
