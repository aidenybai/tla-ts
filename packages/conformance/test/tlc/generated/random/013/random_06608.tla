(*---
description: Evaluates a random int expression, seed 262, number 6608.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06608 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] EXCEPT !.a = @ + (CHOOSE b10137 \in {x \in 1..3 : x > 1} : FALSE)] EXCEPT !.a = @ + (Len(<<1>>) < Head(<<1, 2>>))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06608 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 80 to line 14, col 125 of module random_06608
---*)
