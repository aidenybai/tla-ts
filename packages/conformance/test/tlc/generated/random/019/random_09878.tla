(*---
description: Evaluates a random bool expression, seed 262, number 9878.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09878 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b15352] : b15352 \in ({2, 1, 3} \cup {})}, ({b15353 : b15353 \in SUBSET {1}} \cup ({1} \cap 7))} \subseteq UNION {(DOMAIN <<5, 6>> \ {2, 2}), UNION {(7 .. 2147483647), (0 .. 3)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09878 failed.
    Attempted to check if the value:
    1
    is an element of the integer 7
---*)
