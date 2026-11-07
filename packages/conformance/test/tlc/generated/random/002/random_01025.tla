(*---
description: Evaluates a random set expression, seed 262, number 1025.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01025 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b1655 \in DOMAIN ((CHOOSE f \in [{1} -> {1}] : TRUE) @@ (7 :> -1)) : (((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a = (([a |-> 1]).a % CASE FALSE -> 0 [] OTHER -> 0))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
