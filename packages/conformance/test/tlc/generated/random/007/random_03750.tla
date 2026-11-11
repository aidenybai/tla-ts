(*---
description: Evaluates a random seq expression, seed 262, number 3750.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03750 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((CHOOSE f \in [{1, 2} -> {}] : TRUE))[(-(1 * 7))], ((Len(<<>>) \div (-7)) + CASE (<<1>> = [x \in 1..2 |-> x]) -> (FALSE + 1) [] OTHER -> (3 - 2))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03750 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 53 of module random_03750
---*)
