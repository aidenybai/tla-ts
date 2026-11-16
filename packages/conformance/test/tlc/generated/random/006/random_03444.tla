(*---
description: Evaluates a random set expression, seed 262, number 3444.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03444 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(([x \in 1..2 |-> x] @@ (1 :> 2)))[LET b5460 == 3 IN 3]) :> (-(Tail(<<3, 1, 2>>) \o Tail(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03444 failed.
    Attempted to apply function:
    <<1, 2>>
    to argument 3, which is not in the domain of the function.
---*)
