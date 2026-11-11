(*---
description: Evaluates a random function expression, seed 262, number 96.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00096 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b145 \in DOMAIN ((CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE) @@ (CHOOSE f \in [{0} \cup {1} -> {}] : TRUE)) |-> Cardinality(UNION {({x \in 1..3 : x > 1} \cup {x \in 1..3 : x > 1}), (1 .. 3)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00096 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 82 to line 14, col 121 of module random_00096
---*)
