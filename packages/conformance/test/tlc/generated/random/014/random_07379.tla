(*---
description: Evaluates a random set expression, seed 262, number 7379.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07379 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b11360 \in (((1 - 2) - Cardinality(Nat)) .. Cardinality({-1, 2147483647})) : ((-(-1)) \in {CASE FALSE -> 1 [] OTHER -> b11360, IF FALSE THEN b11360 ELSE TRUE})})
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
