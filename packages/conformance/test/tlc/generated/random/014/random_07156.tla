(*---
description: Evaluates a random record expression, seed 262, number 7156.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07156 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(Tail(<<3, 7>>)), b |-> (\A b11003 \in ((CHOOSE r \in [a : {}] : TRUE) \cap (0 .. 2147483647)) : ((\A b11004 \in {1} : FALSE) <=> (<<3, 1, 2>> = (1 :> 2))))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07156 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 67 to line 14, col 94 of module random_07156
---*)
