(*---
description: Evaluates a random record expression, seed 262, number 8125.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08125 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> CASE TRUE -> 1 [] OTHER -> 7, b |-> (\A b12554 \in 2..1 : [a |-> 1])] EXCEPT !.a = (([a |-> 1, b |-> TRUE]).a * (<<>>).a)] EXCEPT !.a = @ + (([(1 :> 2) EXCEPT ![FALSE] = -1])[(CHOOSE b12555 \in 1..3 : FALSE)] * (-Len(<<1>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08125 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
