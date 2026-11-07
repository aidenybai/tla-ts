(*---
description: Evaluates a random seq expression, seed 262, number 4290.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04290 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<([b6755 \in {1} |-> 2147483647])[(2 + 7)], ([<<1>> EXCEPT !.a = @ + -1]).a>> EXCEPT ![1] = (-(([x \in 1..2 |-> x] @@ (1 :> 2)))[Head(<<>>)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04290 failed.
    In applying the function
    <<2147483647>>,
    the first argument is:
    9
    which is not in its domain.
---*)
