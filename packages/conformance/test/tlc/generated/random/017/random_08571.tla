(*---
description: Evaluates a random int expression, seed 262, number 8571.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08571 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (([x \in 1..2 |-> x])[-1] \in DOMAIN <<5, 6>>) -> ([a |-> 2147483647, b |-> FALSE]).a [] OTHER -> (([a |-> 1]).a % LET b13282 == -1 IN -1) .. (IF (\A b13283 \in 2..1 : FALSE) THEN CASE FALSE -> 3 [] OTHER -> -1 ELSE CASE TRUE -> -1 [] OTHER -> 0 \div CASE (2 = 2147483647) -> IF TRUE THEN -1 ELSE 0 [] OTHER -> (2 % 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08571 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)
