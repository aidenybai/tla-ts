(*---
description: Evaluates a random record expression, seed 262, number 7582.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07582 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([[[a |-> 1] EXCEPT !.a = @ + 7] EXCEPT !.a = @ + ((1 :> 2))[7]]).a, b |-> (~((TRUE <=> FALSE) => (\A b11669 \in {1} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07582 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
