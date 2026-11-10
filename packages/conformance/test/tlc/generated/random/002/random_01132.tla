(*---
description: Evaluates a random function expression, seed 262, number 1132.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01132 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1812 \in {CASE (\E b1813 \in 2..1 : TRUE) -> (7 \div 3) [] OTHER -> CASE TRUE -> 7 [] OTHER -> 2147483647, Cardinality(({} \ {x \in 1..3 : x > 1}))} |-> CASE ((CHOOSE r \in [a : {1, 2}] : TRUE) = [{} EXCEPT !.a = 7]) -> ((b1812 :> [a |-> 1]))[Len(<<>>)] [] OTHER -> Cardinality({b1814 \in {x \in 1..3 : x > 1} : TRUE})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01132 failed.
    Attempted to apply EXCEPT construct to the value {}.
---*)
