(*---
description: Evaluates a random record expression, seed 262, number 1545.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01545 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[TRUE EXCEPT !.a = -1] EXCEPT !.a = Cardinality({1})] EXCEPT !.a = @ + (-(7 % 3))] EXCEPT !.a = @ + (-((2147483647 :> 1))[Len(<<3, 1, 2>>)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01545 failed.
    Attempted to apply EXCEPT construct to the value TRUE.
---*)
