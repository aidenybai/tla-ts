(*---
description: Evaluates a random int expression, seed 262, number 5587.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05587 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b8652 \in (({0, -1} \ {-1, 7}) \ UNION {(7 :> -1), {b8653 \in SUBSET {1} : TRUE}}) : ((CHOOSE r \in [a : {}] : TRUE) = [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b8652] EXCEPT !.a = CASE FALSE -> -1 [] OTHER -> b8652])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05587 failed.
    Attempted to compare the set {{}, {1}} with the value:
    (7 :> -1)
---*)
