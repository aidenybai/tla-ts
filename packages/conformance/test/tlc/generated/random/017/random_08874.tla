(*---
description: Evaluates a random function expression, seed 262, number 8874.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08874 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((0 = 1) @@ [b13744 \in {1} |-> b13744]) EXCEPT ![((1 % 2147483647) \div CASE [x \in 1..2 |-> x] -> 1 [] OTHER -> 7)] = IF (TRUE => FALSE) THEN (2147483647 * TRUE) ELSE CASE TRUE -> -1 [] OTHER -> -1] EXCEPT ![((CHOOSE r \in [a : {1}] : TRUE)).a] = LET b13745 == Len(<<7, 7>>) IN ([<<5, 6>> EXCEPT ![b13745] = 0])[(<<5, 6>>)[b13745]]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08874 failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    FALSE
---*)
