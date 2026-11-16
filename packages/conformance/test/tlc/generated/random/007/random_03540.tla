(*---
description: Evaluates a random seq expression, seed 262, number 3540.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03540 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(CHOOSE b5594 \in DOMAIN (CHOOSE f \in [{} -> {}] : TRUE) : ({1 : b5595 \in 1..3} = {0 : b5596 \in Nat})), (-(CHOOSE b5597 \in (Nat \cap {1, 2}) : (b5597 < 2)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03540 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 121 of module random_03540
---*)
