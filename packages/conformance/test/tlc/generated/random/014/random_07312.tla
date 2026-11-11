(*---
description: Evaluates a random record expression, seed 262, number 7312.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07312 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = ([a |-> 1]).a] EXCEPT !.a = @ + (IF FALSE THEN 1 ELSE 2 % (-0))] EXCEPT !.a = @ + ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = Head(1)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07312 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 49 of module random_07312
---*)
