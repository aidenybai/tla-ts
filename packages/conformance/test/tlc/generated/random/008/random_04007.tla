(*---
description: Evaluates a random bool expression, seed 262, number 4007.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04007 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> CASE (<<1, 2>> = (1 :> 2)) -> (2 * 3) [] OTHER -> Cardinality(1..3), b |-> ([<<1, 2>> EXCEPT ![1] = 1] < CASE TRUE -> 3 [] OTHER -> -1)] EXCEPT !.a = @ + (IF (\A b6297 \in SUBSET {1} : FALSE) THEN CASE TRUE -> 2 [] OTHER -> 2 ELSE (0 - 1) \div (Cardinality({1, 2}) % CASE TRUE -> 0 [] OTHER -> 7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04007 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    <<1, 2>>
---*)
