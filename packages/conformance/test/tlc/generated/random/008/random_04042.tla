(*---
description: Evaluates a random function expression, seed 262, number 4042.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04042 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b6356 \in (1..3 \cup {x \in 1..3 : x > 1}) : Len(<<3, 1, 2>>)) * CASE ([a |-> 1] = [a |-> 1, b |-> TRUE]) -> [a |-> <<1, 2>>, b |-> TRUE] [] OTHER -> (CHOOSE b6357 \in 1..3 : TRUE)) :> LET b6358 == (CASE FALSE -> 1 [] OTHER -> 1 % (7 \div 2147483647)) IN (-(7 + 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04042 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 19 to line 14, col 86 of module random_04042
---*)
