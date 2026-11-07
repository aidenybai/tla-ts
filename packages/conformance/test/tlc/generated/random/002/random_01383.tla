(*---
description: Evaluates a random function expression, seed 262, number 1383.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01383 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2 \div 2) :> IF FALSE THEN 2147483647 ELSE -1) @@ [b2207 \in {-1, -1} |-> (1 - 2147483647)]) @@ (((7 % 3) + Cardinality(Nat)) \div ((-0) % ({2, 1, 3} \cap {2, 1, 3})))))
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
