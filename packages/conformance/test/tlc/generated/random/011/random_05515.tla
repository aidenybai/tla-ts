(*---
description: Evaluates a random set expression, seed 262, number 5515.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05515 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b8525 \in (({1, 2} \cap Nat) \ {-1 : b8526 \in SUBSET {1}}) |-> ((CHOOSE r \in [a : 2..1] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05515 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 90 to line 14, col 119 of module random_05515
---*)
