(*---
description: Evaluates a random record expression, seed 262, number 3182.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03182 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((<<5, 6>>)[3] + Cardinality(1..3)) + ([[x \in Nat |-> x + 1] EXCEPT ![2147483647] = -1])[([x \in 1..2 |-> x])[1]]), b |-> ((IF TRUE THEN 1 ELSE 1 = IF FALSE THEN 2 ELSE 3) <=> [b5066 \in UNION {2..1, {1, 2}} |-> ([a |-> 1] * 3)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03182 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
