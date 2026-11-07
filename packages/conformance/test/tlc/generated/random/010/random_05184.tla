(*---
description: Evaluates a random bool expression, seed 262, number 5184.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05184 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Tail(<<3, FALSE>>)) < ([[[a |-> 1] EXCEPT !.a = 2147483647] EXCEPT !.a = @ + (-1)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    FALSE
    2266:0 The first argument of < should be an integer, but instead it is:
    FALSE
---*)
