(*---
description: Evaluates a random record expression, seed 262, number 6139.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06139 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> CASE (\A b9435 \in {1} : FALSE) -> LET b9436 == 0 IN b9436 [] OTHER -> (-1), b |-> ((1 < 0) \/ (~TRUE))] EXCEPT !.a = [[a |-> (FALSE => TRUE), b |-> (TRUE => FALSE)] EXCEPT !.a = CASE ([a |-> 1, b |-> TRUE] <=> TRUE) -> (7 \div 1) [] OTHER -> Head(<<1, 2>>)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06139 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 209 to line 14, col 238 of module random_06139
---*)
