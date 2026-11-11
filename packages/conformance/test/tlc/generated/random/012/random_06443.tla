(*---
description: Evaluates a random function expression, seed 262, number 6443.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06443 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE) @@ [b9914 \in {CASE TRUE -> <<3, 1, 2>> [] OTHER -> b9915 : b9915 \in {7 : b9916 \in {1, 2}}} |-> (-SubSeq(1..3, 2, b9914))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06443 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 56 of module random_06443
---*)
