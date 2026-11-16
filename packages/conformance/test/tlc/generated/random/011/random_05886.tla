(*---
description: Evaluates a random function expression, seed 262, number 5886.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05886 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((-1) :> ([a |-> 1]).a) EXCEPT ![(CHOOSE b9083 \in {b9084 \in {1} : TRUE} : (\E b9085 \in 1..3 : TRUE))] = ([[a |-> 1] EXCEPT !.a = 2147483647]).a] EXCEPT ![LET b9086 == LET b9087 == Cardinality(TRUE) IN ([x \in 1..2 |-> x])[0] IN Cardinality({[a |-> 1], b9086})] = (((7 \div 7) \div CASE FALSE -> 0 [] OTHER -> 3) - (Len(<<3, 1, 2>>) \div Head(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 39 of module random_05886
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05886 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)
