(*---
description: Evaluates a random record expression, seed 262, number 1859.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01859 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (([b2933 \in 2..1 |-> 3])[(CHOOSE b2934 \in 1..3 : <<1>>)] \div ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]).a), b |-> ((CHOOSE r \in [a : {}] : TRUE) = (CHOOSE r \in [a : 1..2] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 50 to line 14, col 78 of module random_01859
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 50 to line 14, col 78 of module random_01859
---*)
