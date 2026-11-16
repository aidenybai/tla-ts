(*---
description: Evaluates a random bool expression, seed 262, number 5150.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05150 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b7998 \in (2..1 \cup {1}) : (~FALSE)) = (({1, 2} \subseteq {1}) /\ (TRUE \/ FALSE))) \/ (([[a |-> 1] EXCEPT !.a = 7] = (CHOOSE r \in [a : {1}] : TRUE)) /\ ([<<3, 1, 2>> EXCEPT ![1] = 0] = (-1 + 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05150 failed.
    Attempted to check equality of integer 1 with non-integer:
    FALSE
---*)
