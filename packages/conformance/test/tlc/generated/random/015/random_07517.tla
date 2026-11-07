(*---
description: Evaluates a random function expression, seed 262, number 7517.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07517 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11580 \in ({(2147483647 + 1), CASE TRUE -> -1 [] OTHER -> 2147483647} \cup DOMAIN ([x \in Nat |-> x + 1] @@ (1 :> 2))) |-> (-Cardinality({<<>> : b11581 \in SUBSET {1}}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
