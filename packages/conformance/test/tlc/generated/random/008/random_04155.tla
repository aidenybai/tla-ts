(*---
description: Evaluates a random record expression, seed 262, number 4155.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04155 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + [[b6542 \in FALSE |-> b6542] EXCEPT ![([a |-> 1, b |-> TRUE]).a] = Len(<<1>>)]] EXCEPT !.a = @ + (-IF (TRUE => TRUE) THEN Head(<<1>>) ELSE Len(<<1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04155 failed.
    Attempted to check if the value:
    1
    is an element of the boolean FALSE
---*)
