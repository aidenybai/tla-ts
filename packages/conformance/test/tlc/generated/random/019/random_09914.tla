(*---
description: Evaluates a random seq expression, seed 262, number 9914.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09914 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([b15418 \in {-1, -1} |-> ([a |-> 1]).a])[((CHOOSE b15419 \in {x \in 1..3 : x > 1} : FALSE) % LET b15420 == 2 IN 2)], IF ((Nat \cap {1}) = DOMAIN <<5, 6>>) THEN ((TRUE + 2) + Cardinality({})) ELSE CASE (\E b15421 \in 1..3 : FALSE) -> (-1 * 2) [] OTHER -> [a |-> 2, b |-> FALSE]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09914 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 62 to line 14, col 107 of module random_09914
---*)
