(*---
description: Evaluates a random set expression, seed 262, number 3415.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03415 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ((CASE TRUE -> -1 [] OTHER -> 2147483647 :> ([x \in Nat |-> x + 1])[2147483647]) @@ [b5421 \in DOMAIN (1 :> 2) |-> ([x \in Nat |-> x + 1])[b5421]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    -1
    2169:0 The first argument of @@ should be a function, but instead it is:
    -1
---*)
