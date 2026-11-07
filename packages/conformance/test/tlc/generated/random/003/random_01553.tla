(*---
description: Evaluates a random bool expression, seed 262, number 1553.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01553 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] EXCEPT !.a = @ + CASE FALSE -> 2147483647 [] OTHER -> 0] = [[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = @ + ([a |-> 1, b |-> TRUE]).a]) <=> ((UNION {FALSE, {1, 2}} \cup ({1, 2} \ {2, 1, 3})) = {b2478 \in ({x \in 1..3 : x > 1} \cap {2, 1, 3}) : (FALSE <=> FALSE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01553 failed.
    Attempted to compare the set {1, 2} with the value:
    FALSE
---*)
