(*---
description: Evaluates a random record expression, seed 262, number 4568.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04568 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b7164 == (CHOOSE b7165 \in ({2, 1, 3} \ FALSE) : (2 = [x \in 1..2 |-> x])) IN ((CHOOSE b7166 \in 1..3 : TRUE) % (-b7164)), b |-> ({b7167 \in (2..1 \ {1, 2}) : (FALSE \/ TRUE)} = SortSeq([<<1, 2>> EXCEPT ![1] = 2147483647], LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04568 failed.
    Attempted to check if the value:
    2
    is an element of the boolean FALSE
---*)
