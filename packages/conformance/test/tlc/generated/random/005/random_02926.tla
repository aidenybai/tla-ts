(*---
description: Evaluates a random int expression, seed 262, number 2926.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02926 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((((-1 * 0) .. (CHOOSE b4626 \in 1..3 : TRUE)) \cup {(\E b4627 \in {x \in 1..3 : x > 1} : TRUE), Head(<<1>>)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02926 failed.
    Attempted to compare integer 1 with non-integer:
    TRUE
---*)
