(*---
description: Evaluates a random seq expression, seed 262, number 9127.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09127 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<Cardinality((CHOOSE r \in [a : 2..1] : TRUE)), ((SUBSET {1} \cup FALSE) + (1 - -1))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09127 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 36 to line 14, col 65 of module random_09127
---*)
