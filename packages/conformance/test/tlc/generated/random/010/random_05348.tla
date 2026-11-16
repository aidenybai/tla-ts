(*---
description: Evaluates a random int expression, seed 262, number 5348.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05348 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b8265 \in (UNION {({1} \ SUBSET {1}), ({1, 2} \cap {1})} \ DOMAIN [(1 :> 2) EXCEPT ![2147483647] = 1]) : (~(\E b8266 \in [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647] : ([a |-> 1] = [a |-> 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05348 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
