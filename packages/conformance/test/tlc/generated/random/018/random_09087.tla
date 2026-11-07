(*---
description: Evaluates a random record expression, seed 262, number 9087.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09087 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(<<Head(<<1, 2>>), Head(<<3, 1, 2>>)>>), b |-> [[a |-> (7 + 0), b |-> ([a |-> 1] \in SUBSET {1})] EXCEPT !.a = @ + ([<<3, 1, 2>> EXCEPT ![1] = 2] * Len(<<3, 1, 2>>))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09087 failed.
    Attempted to check if the non-enumerable value
    [a |-> 1]
    is element of
    {{}, {1}}
---*)
