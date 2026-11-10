(*---
description: Evaluates a random seq expression, seed 262, number 5238.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05238 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<(~(7 < 0)), (CHOOSE b8115 \in (Nat \ {x \in 1..3 : x > 1}) : ([a |-> 1, b |-> TRUE] = [a |-> 1]))>> EXCEPT ![1] = ((Len(<<>>) + LET b8116 == 0 IN 2) - ([[x \in 1..2 |-> x] EXCEPT ![2] = 0])[(2147483647 + 1)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05238 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
