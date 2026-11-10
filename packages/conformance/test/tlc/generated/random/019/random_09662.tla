(*---
description: Evaluates a random seq expression, seed 262, number 9662.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09662 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] EXCEPT !.a = ((1 :> 2))[2147483647]] EXCEPT !.a = @ + (({} \cup {2, 1, 3})).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09662 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)
