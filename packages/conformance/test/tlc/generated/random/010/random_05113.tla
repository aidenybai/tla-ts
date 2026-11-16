(*---
description: Evaluates a random int expression, seed 262, number 5113.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05113 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Append([(CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE) EXCEPT ![(-2)] = [[a |-> 1] EXCEPT !.a = @ + 2147483647]], (LET b7951 == 7 IN b7951 + (0 * 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05113 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 30 to line 14, col 68 of module random_05113
---*)
