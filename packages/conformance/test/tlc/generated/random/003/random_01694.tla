(*---
description: Evaluates a random function expression, seed 262, number 1694.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01694 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE) EXCEPT ![LET b2704 == (CHOOSE b2705 \in ({1, 2} \cap {2, 1, 3}) : (FALSE \/ FALSE)) IN Len(SortSeq(b2704, LAMBDA p, q : p < q))] = ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = Head(<<1>>)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01694 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 87 to line 14, col 145 of module random_01694
---*)
