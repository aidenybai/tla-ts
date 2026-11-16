(*---
description: Evaluates a random function expression, seed 262, number 7510.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07510 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11567 \in ({(CHOOSE b11569 \in {2, 1, 3} : FALSE) : b11568 \in {b11570 : b11570 \in {2, 1, 3}}} \cap (LET b11571 == 1 IN [a |-> 1, b |-> TRUE] .. Head(<<1>>))) |-> LET b11572 == ((CHOOSE f \in [{1, 2} -> {1}] : TRUE))[(CHOOSE f \in [{1} -> {1}] : TRUE)] IN ((b11572 * b11572) * (b11572 - 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07510 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 31 to line 14, col 65 of module random_07510
---*)
