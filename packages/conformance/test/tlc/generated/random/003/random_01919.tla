(*---
description: Evaluates a random int expression, seed 262, number 1919.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01919 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b3013 \in (([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] = (CHOOSE r \in [a : {2, 1, 3}] : TRUE)) \ DOMAIN (1 :> [a |-> 1])) : [a |-> ((b3013 - b3013) + {b3014 \in <<1>> : TRUE}), b |-> ((\A b3015 \in {x \in 1..3 : x > 1} : TRUE) /\ (-1 = 2147483647))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01919 failed.
    Attempted to enumerate S \ T when S:
    FALSE
    is not enumerable.
---*)
