(*---
description: Evaluates a random seq expression, seed 262, number 9181.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09181 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([<<(1 + 7), IF TRUE THEN 2 ELSE 7>> EXCEPT ![1] = ((CHOOSE f \in [{2, 1, 3} -> {}] : TRUE))[([x \in 1..2 |-> x])[7]]], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09181 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 78 to line 14, col 114 of module random_09181
---*)
