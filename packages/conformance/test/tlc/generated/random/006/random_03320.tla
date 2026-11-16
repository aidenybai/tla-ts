(*---
description: Evaluates a random int expression, seed 262, number 3320.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03320 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((Cardinality({1}) % (FALSE)[2147483647]) = (CHOOSE b5277 \in {b5278 \in 2..1 : FALSE} : (TRUE <=> <<1, 2>>))) THEN ((Head(<<1>>) - ([a |-> 1]).a)).a ELSE (CHOOSE b5279 \in {b5280 \in DOMAIN [x \in 1..2 |-> x] : (b5280 \in 1..3)} : (~({1, 2} = {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03320 failed.
    A non-function (a Boolean value) was applied as a function.
    line 14, col 40 to line 14, col 58 of module random_03320
---*)
