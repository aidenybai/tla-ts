(*---
description: Evaluates a random int expression, seed 262, number 8186.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08186 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> Len(<<3, 1, 2>>), b |-> (3 \cap {1, 2})] EXCEPT !.a = @ + ((<<5, 6>> @@ [x \in 1..2 |-> x]))[SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)]]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08186 failed.
    Attempted to check if the value:
    1
    is an element of the integer 3
---*)
