(*---
description: Evaluates a random int expression, seed 262, number 7764.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07764 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (([x \in 1..2 |-> x])[3] = (7 - -1)) -> Cardinality(({1} \cup {})) [] OTHER -> IF (\E b11970 \in {1, 2} : TRUE) THEN (-1 % 2) ELSE (CHOOSE b11971 \in 2..1 : FALSE) - (-(CHOOSE b11972 \in DOMAIN [x \in 1..2 |-> x] : (~<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07764 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
