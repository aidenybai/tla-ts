(*---
description: Evaluates a random bool expression, seed 262, number 4934.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04934 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(([b7672 \in {} |-> 1])[(1 \div 0)] .. (IF FALSE THEN 7 ELSE 2147483647 - Head(FALSE))) EXCEPT !.a = @ + LET b7673 == (CHOOSE b7674 \in (1..3 \cup {1, 2}) : Len(<<1>>)) IN ([a |-> -1, b |-> FALSE]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04934 failed.
    2179:0 The second argument of \div is 0.
---*)
