(*---
description: Evaluates a random int expression, seed 262, number 5360.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05360 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE))[LET b8289 == Head(<<1, 2>>) IN ([a |-> 1]).a] % (Append((<<1, 2>> \o <<>>), LET b8290 == -1 IN b8290) \cup ({b8291 \in {} : FALSE} \ {b8292 : b8292 \in {}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05360 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 58 of module random_05360
---*)
