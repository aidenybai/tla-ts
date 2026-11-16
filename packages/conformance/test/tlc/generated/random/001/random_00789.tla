(*---
description: Evaluates a random int expression, seed 262, number 789.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00789 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : 1..2] : TRUE)).a * ((CHOOSE b1300 \in {b1301 : b1301 \in [a |-> 1, b |-> TRUE]} : ([a |-> 1] = [a |-> 1])) \div CASE (FALSE => TRUE) -> CASE TRUE -> 2 [] OTHER -> 2147483647 [] OTHER -> ((1 :> 2))[1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00789 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1, b |-> TRUE].
    line 14, col 94 to line 14, col 114 of module random_00789
---*)
