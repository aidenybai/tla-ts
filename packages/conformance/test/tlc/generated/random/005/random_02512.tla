(*---
description: Evaluates a random bool expression, seed 262, number 2512.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02512 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> CASE TRUE -> 2 [] OTHER -> 1, b |-> (TRUE <=> <<5, 6>>)]).a = (LET b3964 == ([a |-> 1, b |-> TRUE] \cup 2) IN (b3964 % b3964) * (IF FALSE THEN 0 ELSE 7 * Cardinality({})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02512 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 62 to line 14, col 78 of module random_02512
---*)
