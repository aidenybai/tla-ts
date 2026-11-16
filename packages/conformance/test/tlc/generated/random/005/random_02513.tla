(*---
description: Evaluates a random set expression, seed 262, number 2513.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02513 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(DOMAIN [b3965 \in SUBSET {1} |-> b3965]) .. (((3 :> 7))[([a |-> 1, b |-> TRUE]).a] + (Len(<<1>>) - (FALSE \/ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02513 failed.
    Attempted to apply function:
    (3 :> 7)
    to argument 1, which is not in the domain of the function.
---*)
