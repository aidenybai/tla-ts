(*---
description: Evaluates a random function expression, seed 262, number 1879.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01879 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b2955 \in DOMAIN (2 :> -1) |-> IF (~TRUE) THEN (<<5, 6>>)[b2955] ELSE (b2955 % 2)] @@ [b2956 \in ((CHOOSE b2957 \in SUBSET {1} : FALSE) .. [[a |-> 1] EXCEPT !.a = 0]) |-> (([a |-> 1, b |-> TRUE]).a \div Cardinality(2..1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01879 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 117 to line 14, col 151 of module random_01879
---*)
