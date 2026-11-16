(*---
description: Evaluates a random set expression, seed 262, number 6922.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06922 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b10594 \in ({(7 - 7), (3 + -1)} \cup ({2147483647, {1, 2}} \cap {b10595 : b10595 \in 2..1})) : (((<<>> \o <<>>) \o (<<3, 1, 2>> \o <<1, 2>>)) = (CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06922 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 162 to line 14, col 200 of module random_06922
---*)
