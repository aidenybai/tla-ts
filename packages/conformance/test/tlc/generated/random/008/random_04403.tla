(*---
description: Evaluates a random set expression, seed 262, number 4403.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04403 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN 7 ELSE 7 * Head(<<1, 2>>)) + (CHOOSE f \in [{2, 1, 3} -> {}] : TRUE)) .. (CHOOSE b6928 \in ((3 .. 0) \cup {0, 2147483647}) : ((0 < b6928) /\ ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04403 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 63 to line 14, col 99 of module random_04403
---*)
