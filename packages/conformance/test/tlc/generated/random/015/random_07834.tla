(*---
description: Evaluates a random seq expression, seed 262, number 7834.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07834 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b12102 \in {0, 0} |-> ([a |-> 1, b |-> TRUE]).a])[([a |-> 2147483647, b |-> TRUE]).a] :> (CHOOSE b12103 \in {b12104 \in {b12105 \in {} : FALSE} : (\E b12106 \in {} : 2)} : ([<<1>> EXCEPT ![1] = b12103] = ((1 :> 2) @@ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07834 failed.
    In applying the function
    (0 :> 1),
    the first argument is:
    2147483647
    which is not in its domain.
---*)
