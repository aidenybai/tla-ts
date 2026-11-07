(*---
description: Evaluates a random bool expression, seed 262, number 9720.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09720 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((((1 :> 2) @@ FALSE) \ DOMAIN [x \in 1..2 |-> x]) \cap {IF TRUE THEN b15079 ELSE 1 : b15079 \in {b15080 : b15080 \in 1..3}}) = {(([x \in Nat |-> x + 1] @@ 1))[Head(<<1, 2>>)] : b15081 \in {Cardinality(Nat) : b15082 \in DOMAIN <<5, 6>>}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    FALSE
    2169:0 The second argument of @@ should be a function, but instead it is:
    FALSE
---*)
