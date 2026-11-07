(*---
description: Evaluates a random seq expression, seed 262, number 2870.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02870 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(([<<1, 2>> EXCEPT ![1] = 3] \o <<0, -1>>), LET b4546 == (1 * 0) IN Cardinality({1})) \o <<([a |-> 2147483647, b |-> TRUE]).a, ((CHOOSE b4547 \in {} : TRUE) + Head(<<3, 1, 2>>))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02870 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 152 to line 14, col 177 of module random_02870
---*)
