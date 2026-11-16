(*---
description: Evaluates a random bool expression, seed 262, number 9715.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09715 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) \in UNION {DOMAIN (-1 :> [a |-> 1, b |-> TRUE]), (DOMAIN (1 :> 2) \cap UNION {{x \in 1..3 : x > 1}, SUBSET {1}})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09715 failed.
    Attempted to compare the set {} with the value:
    2
---*)
