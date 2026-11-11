(*---
description: Evaluates a random record expression, seed 262, number 265.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00265 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[7 EXCEPT !.a = @ + 2147483647] EXCEPT !.a = (7 - 2147483647)] EXCEPT !.a = LET b443 == ([a |-> 1, b |-> TRUE]).a IN CASE TRUE -> 1 [] OTHER -> b443] EXCEPT !.a = @ + (-Len([<<>> EXCEPT ![1] = 2]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00265 failed.
    Attempted to apply EXCEPT construct to the value 7.
---*)
