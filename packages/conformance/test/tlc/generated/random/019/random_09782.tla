(*---
description: Evaluates a random set expression, seed 262, number 9782.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09782 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b15187 \in ({([a |-> 1, b |-> TRUE]).a, (3 + 2147483647)} \ (DOMAIN (1 :> 2) \cap {b15188 : b15188 \in {2, 1, 3}})) : (~({1 : b15189 \in 2..1} = (1..3 \cap SUBSET {1})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 3+2147483647
    2178:0 Overflow when computing 3+2147483647
---*)
