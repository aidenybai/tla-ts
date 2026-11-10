(*---
description: Evaluates a random record expression, seed 262, number 2997.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02997 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = @ + CASE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] = (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)) -> ((7 * 1) % (2147483647 - 1)) [] OTHER -> ((<<5, 6>>)[-1] % Len(<<3, 1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02997 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 47 of module random_02997
---*)
