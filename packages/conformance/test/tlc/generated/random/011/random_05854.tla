(*---
description: Evaluates a random set expression, seed 262, number 5854.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05854 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b9033 \in ((CHOOSE b9034 \in {b9035 \in {x \in 1..3 : x > 1} : FALSE} : (TRUE => FALSE)) .. (-Head(<<3, 1, 2>>))) : ((\E b9036 \in (Nat \cup {2, 1, 3}) : (0 = -1)) /\ ((~TRUE) => (\E b9037 \in SUBSET {1} : FALSE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05854 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 29 to line 14, col 103 of module random_05854
---*)
