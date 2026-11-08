(*---
description: Evaluates a random bool expression, seed 262, number 1293.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01293 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = @ + (1 + [a |-> 1, b |-> TRUE])]).a < ({(CHOOSE b2060 \in {1, 2} : TRUE) : b2059 \in [(1 :> 2) EXCEPT ![2] = 2]} - (([a |-> 1]).a % Len(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01293 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
