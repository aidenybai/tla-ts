(*---
description: Evaluates a random bool expression, seed 262, number 5453.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05453 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1] EXCEPT !.a = 7] < (CHOOSE b8444 \in SUBSET {1} : TRUE)) => ((FALSE => TRUE) <=> (<<>> = (1 :> 2)))) \/ (((-1) % IF <<>> THEN 2 ELSE 2) \in UNION {DOMAIN (1 :> 2), (1..3 \ Nat)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05453 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> 7]
---*)
