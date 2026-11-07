(*---
description: Evaluates a random seq expression, seed 262, number 7504.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07504 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ((1 .. b11562) \subseteq [a |-> -1, b |-> TRUE]) -> Cardinality((SUBSET {1} \cup {1, 2})) [] OTHER -> (([a |-> 1, b |-> TRUE]).a + IF FALSE THEN b11562 ELSE 2) : b11562 \in {((2 * 3) * Cardinality({})), ([b11563 \in {} |-> 2])[(1 % 0)]}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
