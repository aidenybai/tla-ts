(*---
description: Evaluates a random seq expression, seed 262, number 5136.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05136 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(LET b7979 == (2147483647 - 2147483647) IN (2147483647 % 1) \div (Cardinality(Nat) * CASE FALSE -> 1 [] OTHER -> 2147483647)), ((LET b7980 == -1 IN FALSE - (-<<5, 6>>)) % (([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]))[(-2)])>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
