(*---
description: Evaluates a random record expression, seed 262, number 1075.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01075 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = CASE (\A b1716 \in ({1} \ 1) : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) -> Head([<<1, 2>> EXCEPT ![1] = 2]) [] OTHER -> (([a |-> 1, b |-> TRUE]).a - CASE TRUE -> 7 [] OTHER -> 3)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01075 failed.
    Attempted to check if the value:
    1
    is an element of the integer 1
---*)
