(*---
description: Evaluates a random function expression, seed 262, number 804.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00804 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Cardinality(UNION {1..3, {1, 2}}) :> (CHOOSE b1317 \in UNION {2..1, {1, 2}} : [[a |-> 1] EXCEPT !.a = @ + 3])) EXCEPT ![(IF (2147483647 \in 1..3) THEN (1 + 2) ELSE Cardinality({2, 1, 3}) \div (Cardinality({2, 1, 3}) % LET b1318 == 0 IN b1318))] = {(-Len(<<1, 2>>)), (Head(<<1>>) % (-1 % 2))}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00804 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 56 to line 14, col 125 of module random_00804
---*)
