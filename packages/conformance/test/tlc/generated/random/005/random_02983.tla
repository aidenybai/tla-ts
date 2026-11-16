(*---
description: Evaluates a random function expression, seed 262, number 2983.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02983 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len([(<<>> \o <<1>>) EXCEPT ![1] = (2147483647 % 2)]) :> ([[[a |-> 1] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = @ + (1 % 2)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02983 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
