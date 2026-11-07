(*---
description: Evaluates a random set expression, seed 262, number 2684.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02684 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN ((2147483647 \in Nat) @@ [b4246 \in 2..1 |-> 2147483647]) \cap UNION {((2 .. 1) \cap ({1, 2} \cap Nat)), DOMAIN (0 :> 0)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    TRUE
    2169:0 The first argument of @@ should be a function, but instead it is:
    TRUE
---*)
