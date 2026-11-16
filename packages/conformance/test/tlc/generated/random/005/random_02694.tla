(*---
description: Evaluates a random function expression, seed 262, number 2694.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02694 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{} -> {0} \cup {1}] : TRUE) @@ [(CHOOSE f \in [{2, 1, 3} -> {}] : TRUE) EXCEPT ![[a |-> IF TRUE THEN SUBSET {1} ELSE 3, b |-> (TRUE => TRUE)]] = Head(Append(<<3, 1, 2>>, 7))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02694 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 65 to line 14, col 101 of module random_02694
---*)
