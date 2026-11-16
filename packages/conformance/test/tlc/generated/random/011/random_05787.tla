(*---
description: Evaluates a random int expression, seed 262, number 5787.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05787 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b8922 \in (DOMAIN [b8923 \in {1} |-> b8923] \cap ({0, 1} \cap (<<5, 6>> @@ (1 :> 2)))) : (([[x \in Nat |-> x + 1] EXCEPT ![-1] = 1] @@ (b8922 :> 2)) = (CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \cap {2}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05787 failed.
    Attempted to check if the value:
    0
    is an element of the function <<5, 6>>
---*)
