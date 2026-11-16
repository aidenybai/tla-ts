(*---
description: Evaluates a random record expression, seed 262, number 8784.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08784 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{b13609 \in {-1 : b13610 \in {x \in 1..3 : x > 1}} : (2 \in Nat)}, {b13611 \in (2..1 \ {x \in 1..3 : x > 1}) : (~TRUE)}} \cap DOMAIN [b13612 \in (SUBSET {1} \ {1, 2}) |-> ([a |-> 1, b |-> TRUE]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08784 failed.
    Attempted to check if the non-enumerable value
    -1
    is element of
    {{}, {1}}
---*)
