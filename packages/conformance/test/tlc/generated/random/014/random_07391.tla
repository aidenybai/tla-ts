(*---
description: Evaluates a random int expression, seed 262, number 7391.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07391 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b11377 \in {b11378 \in ({2147483647 : b11379 \in SUBSET {1}} \cup ({1} \ {x \in 1..3 : x > 1})) : (LET b11380 == b11378 IN 3 \in ({} \ {1, 2}))} : Len(SubSeq([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647], ([x \in 1..2 |-> x])[7], (CHOOSE b11381 \in {} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07391 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 17 to line 14, col 291 of module random_07391
---*)
