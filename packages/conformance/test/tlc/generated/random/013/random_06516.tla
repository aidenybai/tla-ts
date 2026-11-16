(*---
description: Evaluates a random bool expression, seed 262, number 6516.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06516 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{} -> {}] : TRUE) = (([[a |-> 1] EXCEPT !.a = 3]).a .. (Head(<<3, 1, 2>>) \div (CHOOSE b10017 \in 2..1 : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06516 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 112 to line 14, col 140 of module random_06516
---*)
