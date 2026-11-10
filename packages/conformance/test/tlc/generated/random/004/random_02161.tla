(*---
description: Evaluates a random seq expression, seed 262, number 2161.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02161 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<LET b3414 == [a |-> (-2), b |-> (0 = TRUE)] IN ((CHOOSE r \in [a : 2..1] : TRUE) - (b3414 - b3414)), (-Head((<<1, 2>> \o <<1, 2>>)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02161 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 67 to line 14, col 96 of module random_02161
---*)
