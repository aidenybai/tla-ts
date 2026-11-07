(*---
description: Evaluates a random record expression, seed 262, number 6668.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06668 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + Head(([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] \o <<3, 3>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    [a |-> 3, b |-> TRUE]
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    [a |-> 3, b |-> TRUE]
---*)
