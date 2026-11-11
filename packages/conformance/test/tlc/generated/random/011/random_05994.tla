(*---
description: Evaluates a random set expression, seed 262, number 5994.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05994 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b9243 \in {Head(<<-1, 2..1>>), ([a |-> 2147483647, b |-> TRUE]).a} : ((CHOOSE b9244 \in (b9243 .. -1) : (2147483647 < b9243)) \in DOMAIN [b9245 \in {1} |-> 1])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05994 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 88 to line 14, col 140 of module random_05994
---*)
