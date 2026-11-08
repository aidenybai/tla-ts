(*---
description: Evaluates a random set expression, seed 262, number 8387.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08387 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1] EXCEPT !.a = @ + 0] EXCEPT !.a = @ + (2 \div 0)] EXCEPT !.a = Len([<<1>> EXCEPT ![1] = [a |-> 1, b |-> TRUE]])]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08387 failed.
    2179:0 The second argument of \div is 0.
---*)
