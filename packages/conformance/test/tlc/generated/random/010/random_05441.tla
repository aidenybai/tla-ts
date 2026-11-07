(*---
description: Evaluates a random bool expression, seed 262, number 5441.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05441 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2147483647 - 3) - Cardinality(Nat)) % (-(CHOOSE b8426 \in {2, 1, 3} : FALSE))) < (((2 * 7) * CASE TRUE -> 2147483647 [] OTHER -> 2) \div (IF TRUE THEN 2147483647 ELSE 2147483647 - [a |-> <<1>>, b |-> FALSE]))))
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
