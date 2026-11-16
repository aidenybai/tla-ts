(*---
description: Evaluates a random int expression, seed 262, number 480.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00480 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 - 1) * CASE FALSE -> 1 [] OTHER -> 2) + (CHOOSE b793 \in (2..1 \ {}) : ([a |-> 1, b |-> TRUE] = [a |-> 1]))) * ([a |-> Len(<<3, 1, 2>>), b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1])]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00480 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 63 to line 14, col 127 of module random_00480
---*)
