(*---
description: Evaluates a random bool expression, seed 262, number 9074.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09074 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE f \in [{} -> {1, 2}] : TRUE))[(CHOOSE b14098 \in {1} : FALSE)] = (Cardinality([a |-> 1]) .. CASE FALSE -> 2 [] OTHER -> 2147483647)) <=> (Head(UNION {{}, {1}}) = ([[a |-> 1] EXCEPT !.a = 1]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09074 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 58 to line 14, col 86 of module random_09074
---*)
