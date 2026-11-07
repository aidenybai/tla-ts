(*---
description: Evaluates a random function expression, seed 262, number 3387.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03387 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(CASE TRUE -> -1 [] OTHER -> 0 + (CHOOSE b5379 \in {1} : FALSE))) :> Cardinality(DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![2] = -1])))
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
