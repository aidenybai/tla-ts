(*---
description: Evaluates a random record expression, seed 262, number 6715.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06715 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (1 + 2147483647), b |-> (1..3 = {})] EXCEPT !.a = @ + (-LET b10292 == 2 IN 7)] EXCEPT !.a = LET b10293 == Head((<<3, 1, 2>> \o <<1>>)) IN Len([<<3, 1, 2>> EXCEPT ![1] = 2])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
