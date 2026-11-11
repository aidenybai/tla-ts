(*---
description: Evaluates a random int expression, seed 262, number 6537.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06537 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b10049 \in ((CHOOSE b10050 \in UNION {{2, 1, 3}, 2..1} : (2 \in {1})) .. (Len(<<3, 1, 2>>) + ([a |-> 1]).a)) : (~((TRUE \/ TRUE) \/ (FALSE => FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06537 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 37 to line 14, col 91 of module random_06537
---*)
