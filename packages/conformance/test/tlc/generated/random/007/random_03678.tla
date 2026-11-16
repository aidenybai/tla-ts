(*---
description: Evaluates a random bool expression, seed 262, number 3678.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03678 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({2, 1} \ {TRUE : b5813 \in {}}) \subseteq (DOMAIN (1 :> 2) \ DOMAIN <<5, 6>>)) \/ (DOMAIN (1 :> 0) = DOMAIN (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03678 failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
