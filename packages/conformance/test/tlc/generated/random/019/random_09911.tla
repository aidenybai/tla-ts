(*---
description: Evaluates a random set expression, seed 262, number 9911.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09911 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (([x \in 1..2 |-> x] @@ (1 :> 2)) @@ ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x])) \ {b15413 \in ((TRUE \ {}) \cup (FALSE /\ FALSE)) : ((Nat \ {2, 1, 3}) = UNION {{1, 2}, [a |-> 1, b |-> TRUE]})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09911 failed.
    Attempted to check if the value:
    1
    is an element of the boolean TRUE
---*)
