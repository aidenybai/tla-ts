(*---
description: Evaluates a random record expression, seed 262, number 6458.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06458 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head(SelectSeq(<<1>>, LAMBDA e : e > 0)), b |-> ((TRUE \/ FALSE) /\ (TRUE => TRUE))] EXCEPT !.a = (-((CHOOSE b9939 \in {x \in 1..3 : x > 1} : [a |-> 1]) \div (3 + 7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06458 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 126 to line 14, col 174 of module random_06458
---*)
