(*---
description: Evaluates a random set expression, seed 262, number 1200.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01200 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({Cardinality({1}) : b1930 \in ({1, 2} \cup 1..3)} \cup DOMAIN (CHOOSE f \in [{1, 2} -> 2..1] : TRUE)) \ (-IF ({} = {x \in 1..3 : x > 1}) THEN (2 + 3) ELSE CASE TRUE -> 3 [] OTHER -> 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01200 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 81 to line 14, col 116 of module random_01200
---*)
