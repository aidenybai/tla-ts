(*---
description: Evaluates a random record expression, seed 262, number 7243.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07243 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b11137 \in {(b11138 * b11138) : b11138 \in {b11139 \in {} : FALSE}} : {(b11137 - b11137), (7 * b11137)}), b |-> (\E b11140 \in (UNION {1..3, {2, 1, 3}} .. CASE TRUE -> -1 [] OTHER -> 2) : ((TRUE \/ SUBSET {1}) \subseteq ({} \cup {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07243 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 24 to line 14, col 133 of module random_07243
---*)
