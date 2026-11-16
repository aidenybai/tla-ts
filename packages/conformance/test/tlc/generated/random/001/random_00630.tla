(*---
description: Evaluates a random record expression, seed 262, number 630.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00630 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE b1055 \in (1..3 \cup 2..1) : (b1055 \in 2..1)), b |-> ((~FALSE) <=> (7 < 2147483647))] EXCEPT !.a = Len((SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o SelectSeq(<<1>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00630 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 76 of module random_00630
---*)
