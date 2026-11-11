(*---
description: Evaluates a random bool expression, seed 262, number 9515.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09515 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b14779 \in ({2, 1, 3} \ {1}) : (1 = b14779)) \in (CHOOSE f \in [{1, 2} -> 1..2] : TRUE)) => (((0 - 2) \in {b14780 \in 2..1 : TRUE}) /\ (\A b14781 \in (Nat \cup Nat) : ({x \in 1..3 : x > 1} = {x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09515 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 68 of module random_09515
---*)
