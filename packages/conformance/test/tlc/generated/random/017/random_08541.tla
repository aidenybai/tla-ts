(*---
description: Evaluates a random bool expression, seed 262, number 8541.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08541 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (\E b13235 \in {b13236 : b13236 \in {1, 2}} : (<<1, 2>> = (1 :> 2))) -> (Head(FALSE) \div (3 + 1)) [] OTHER -> ((0 :> 1))[LET b13237 == 3 IN b13237] \in DOMAIN [b13238 \in DOMAIN <<5, 6>> |-> Cardinality(TRUE)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08541 failed.
    Attempted to apply function:
    (0 :> 1)
    to argument 3, which is not in the domain of the function.
---*)
