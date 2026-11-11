(*---
description: Evaluates a random bool expression, seed 262, number 1813.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01813 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~({((1 :> 2))[2147483647], (3 * 7)} = {b2871 \in {b2872 : b2872 \in {1}} : [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b2871]})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01813 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)
