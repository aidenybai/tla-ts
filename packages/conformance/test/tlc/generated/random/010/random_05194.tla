(*---
description: Evaluates a random bool expression, seed 262, number 5194.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05194 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((~({2, 1, 3} = SUBSET {1})) \/ (\A b8054 \in (-1 .. 2) : [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b8054])) => (((2..1 \cup 1..3) \cap {b8055 \in {} : TRUE}) \subseteq ((SUBSET {1} \cup {1}) \cap {b8056 \in 1..3 : TRUE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05194 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
