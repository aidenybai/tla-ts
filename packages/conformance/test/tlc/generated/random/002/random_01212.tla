(*---
description: Evaluates a random record expression, seed 262, number 1212.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01212 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[<<1, 2>> EXCEPT ![1] = -1] EXCEPT !.a = Head(<<3, 1, 2>>)] EXCEPT !.a = (-([a |-> 1]).a)] EXCEPT !.a = ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] EXCEPT !.a = @ + Head(<<>>)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01212 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
