(*---
description: Evaluates a random bool expression, seed 262, number 3741.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03741 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-Head(<<-1, 2147483647>>)) < (([[x \in 1..2 |-> x] EXCEPT ![1] = 7])[CASE TRUE -> 2147483647 [] OTHER -> 2147483647] + ((<<3, 1, 2>> \o <<>>) + Len(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03741 failed.
    In applying the function
    <<7, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)
