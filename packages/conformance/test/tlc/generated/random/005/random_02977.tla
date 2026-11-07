(*---
description: Evaluates a random set expression, seed 262, number 2977.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02977 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b4726 \in {(-1 - 2), ([a |-> 1]).a} : ((\A b4727 \in 2..1 : TRUE) /\ (FALSE <=> TRUE))), Cardinality((UNION {SUBSET {1}, 1..3} \cup {b4728 : b4728 \in SUBSET {1}}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02977 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 110 of module random_02977
---*)
