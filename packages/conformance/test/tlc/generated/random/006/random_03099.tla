(*---
description: Evaluates a random int expression, seed 262, number 3099.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03099 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(([x \in 1..2 |-> x] @@ (1 :> 2)))[(-2)]) + (LET b4942 == LET b4943 == -1 IN 1 IN (<<1>> % b4942) % Len(Append(<<>>, 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03099 failed.
    Attempted to apply function:
    <<1, 2>>
    to argument -2, which is not in the domain of the function.
---*)
