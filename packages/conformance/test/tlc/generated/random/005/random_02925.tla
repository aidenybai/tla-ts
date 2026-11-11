(*---
description: Evaluates a random set expression, seed 262, number 2925.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02925 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN [(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = @ + Cardinality({1})], (((SUBSET {1} \ {1}) \ (3 .. 3)) \cup UNION {{0, -1}, (2..1 \ {2, 1, 3})})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02925 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 32 to line 14, col 61 of module random_02925
---*)
