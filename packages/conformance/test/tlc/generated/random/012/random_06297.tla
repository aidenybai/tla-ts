(*---
description: Evaluates a random record expression, seed 262, number 6297.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06297 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (1 \div 2), b |-> (\E b9684 \in SUBSET {1} : TRUE)] EXCEPT !.a = @ + Head([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3])] EXCEPT !.a = @ + (-(CHOOSE b9685 \in {[a |-> 1] : b9686 \in {}} : [b9687 \in {1, 2} |-> b9687]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06297 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 3, b |-> TRUE]
---*)
