(*---
description: Evaluates a random seq expression, seed 262, number 6039.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06039 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {0} \cup {1}] : TRUE) @@ ([(1 :> 2) EXCEPT ![[a |-> 1, b |-> TRUE]] = 1] @@ (CHOOSE f \in [{1} -> {2, 1, 3}] : TRUE))) @@ [b9301 \in (Tail(<<1>>) \cap {b9302 \in {} : TRUE}) |-> Head((Nat \ {1}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06039 failed.
    Attempted to check equality of integer 1 with non-integer:
    [a |-> 1, b |-> TRUE]
---*)
