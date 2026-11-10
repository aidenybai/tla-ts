(*---
description: Evaluates a random bool expression, seed 262, number 7936.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07936 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b12250 \in {((0 % 2147483647) * (2147483647 + -1)), (Head(<<1>>) * ([x \in 1..2 |-> x])[<<5, 6>>])} : (((FALSE <=> FALSE) <=> (<<>> = (1 :> 2))) \/ ({2147483647 : b12251 \in SUBSET {1}} = DOMAIN (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07936 failed.
    Attempted to check if the value:
    <<5, 6>>
    is in the integer interval 1..2
---*)
