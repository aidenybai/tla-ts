(*---
description: Evaluates a random set expression, seed 262, number 5012.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05012 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(-0), ((1 :> 2))[2147483647]} \cup UNION {{b7798 \in 2 : <<>>}, DOMAIN [x \in 1..2 |-> x]}) \cap UNION {DOMAIN Cardinality({2, 1, 3}), ({-1, 7} \ ({1, 2} \ 1..3))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05012 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)
