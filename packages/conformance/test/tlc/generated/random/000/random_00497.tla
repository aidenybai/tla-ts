(*---
description: Evaluates a random set expression, seed 262, number 497.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00497 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(IF (FALSE \/ TRUE) THEN Cardinality({1, 2}) ELSE (3 - 2) % (UNION {{1}, <<>>} \subseteq {2147483647 : b823 \in <<5, 6>>})), CASE ((CHOOSE r \in [a : {}] : TRUE) = [1..3 EXCEPT !.a = 2]) -> ([a |-> SUBSET {1}, b |-> FALSE]).a [] OTHER -> (-([a |-> 1]).a)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00497 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 149 to line 14, col 176 of module random_00497
---*)
