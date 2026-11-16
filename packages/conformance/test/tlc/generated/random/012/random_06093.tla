(*---
description: Evaluates a random int expression, seed 262, number 6093.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06093 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF 0 THEN 0 ELSE -1 + (<<3, 1, 2>> \in {})) * IF (FALSE => FALSE) THEN ([a |-> 1]).a ELSE Len(<<1, 2>>)) + (((CHOOSE r \in [a : 1..2] : TRUE)).a + (-CASE TRUE -> 0 [] OTHER -> 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06093 failed.
    A non-boolean expression (an integer) was used as the condition of an IF.
    line 14, col 19 to line 14, col 60 of module random_06093
---*)
