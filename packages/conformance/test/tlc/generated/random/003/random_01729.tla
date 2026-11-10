(*---
description: Evaluates a random int expression, seed 262, number 1729.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01729 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Append(<<-1, 7>>, Len(<<1, 2>>))) + (Len(Tail(<<3, 1, 2>>)) - (CHOOSE b2748 \in {b2749 : b2749 \in {x \in 1..3 : x > 1}} : (\E b2750 \in SUBSET {1} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01729 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 85 to line 14, col 177 of module random_01729
---*)
