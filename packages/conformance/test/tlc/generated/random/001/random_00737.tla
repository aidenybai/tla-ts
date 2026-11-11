(*---
description: Evaluates a random function expression, seed 262, number 737.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00737 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1208 \in ({([a |-> 1]).a, LET b1209 == 3 IN 3} \cap (([x \in 1..2 |-> x])[2147483647] .. Head(<<1>>))) |-> IF (\E b1210 \in DOMAIN (1 :> 2) : (1..3 \subseteq {1, 2})) THEN (CHOOSE b1211 \in {b1212 : b1212 \in {1}} : (b1211 \in {1})) ELSE (CASE TRUE -> 2147483647 [] OTHER -> b1208 % (CHOOSE b1213 \in {1, 2} : FALSE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00737 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)
