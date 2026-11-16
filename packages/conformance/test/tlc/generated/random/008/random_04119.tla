(*---
description: Evaluates a random record expression, seed 262, number 4119.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04119 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Cardinality(UNION {2..1, 2..1}) - (CHOOSE b6470 \in {b6471 : b6471 \in {}} : (~TRUE))), b |-> ((({1} \cup {1}) \ UNION {{1, 2}, 1..3}) \subseteq UNION {UNION {{1}, FALSE}, (2 \ {2, 1, 3})})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04119 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 59 to line 14, col 107 of module random_04119
---*)
