(*---
description: Evaluates a random seq expression, seed 262, number 2286.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02286 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(Head(<<1>>) - Cardinality({})) EXCEPT !.a = @ + CASE (\A b3602 \in {x \in 1..3 : x > 1} : FALSE) -> (7 + 1) [] OTHER -> ([x \in 1..2 |-> x])[7]] = [[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] EXCEPT !.a = (7 % 2)] EXCEPT !.a = @ + LET b3603 == (7 + 3) IN LET b3604 == 0 IN 0]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02286 failed.
    Attempted to apply EXCEPT construct to the value 1.
---*)
