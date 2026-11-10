(*---
description: Evaluates a random set expression, seed 262, number 1442.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01442 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [(CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE) EXCEPT ![(-(CHOOSE b2310 \in {1, 2} : FALSE))] = (CHOOSE b2311 \in ({x \in 1..3 : x > 1} \ 1..3) : (\E b2312 \in {} : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01442 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 84 to line 14, col 114 of module random_01442
---*)
