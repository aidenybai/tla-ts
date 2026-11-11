(*---
description: Evaluates a random bool expression, seed 262, number 5203.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05203 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b8072 \in [(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = (Len(<<1, 2>>) % Cardinality(SUBSET {1}))] : ((CHOOSE b8073 \in UNION {1..3, {1}} : (<<1>> = SUBSET {1})) < (Head(<<>>) \div Cardinality(2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05203 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 32 to line 14, col 59 of module random_05203
---*)
