(*---
description: Evaluates a random function expression, seed 262, number 7251.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07251 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11154 \in DOMAIN (CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE) |-> ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] EXCEPT !.a = (7 % b11154)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
