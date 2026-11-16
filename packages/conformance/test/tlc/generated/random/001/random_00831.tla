(*---
description: Evaluates a random set expression, seed 262, number 831.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00831 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN UNION {((0 .. 1) \cup [[a |-> 1, b |-> TRUE] EXCEPT !.a = 3]), ({b1355 : b1355 \in 2..1} \cup (3 .. 1))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00831 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a set of the form UNION  S)
    line 14, col 16 to line 14, col 126 of module random_00831
---*)
