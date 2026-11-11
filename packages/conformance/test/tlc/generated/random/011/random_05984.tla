(*---
description: Evaluates a random set expression, seed 262, number 5984.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05984 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(DOMAIN ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) \ {(CHOOSE b9220 \in {} : TRUE), [a |-> <<1>>, b |-> FALSE]}), UNION {({0, 3} \cup (1 .. 1)), {b9221 \in DOMAIN [x \in 1..2 |-> x] : (\A b9222 \in 1..3 : TRUE)}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05984 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 78 to line 14, col 103 of module random_05984
---*)
