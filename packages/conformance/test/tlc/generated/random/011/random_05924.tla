(*---
description: Evaluates a random int expression, seed 262, number 5924.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05924 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> CASE (2..1 \subseteq Nat) -> ([x \in Nat |-> x + 1])[2147483647] [] OTHER -> IF TRUE THEN 3 ELSE 3, b |-> [b9132 \in {3 : b9133 \in SUBSET {1}} |-> (-b9132)]]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
