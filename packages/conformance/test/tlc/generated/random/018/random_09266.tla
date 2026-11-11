(*---
description: Evaluates a random bool expression, seed 262, number 9266.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09266 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2147483647 .. 0) \cup DOMAIN (1 :> 2)) \ (({1, 2} \cap 2..1) \ DOMAIN (1 :> 2))) \cap ({(<<5, 6>>)[b14382] : b14382 \in {3, 7}} \cup ((2..1 \cup Nat) \ ([x \in Nat |-> x + 1] \ {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09266 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
