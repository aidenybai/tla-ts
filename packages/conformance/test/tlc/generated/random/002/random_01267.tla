(*---
description: Evaluates a random seq expression, seed 262, number 1267.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01267 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(SelectSeq(Tail(<<1>>), LAMBDA e : e > 0), LAMBDA e : e > 0) EXCEPT ![1] = (([[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]).a + (CHOOSE b2022 \in (2147483647 .. [a |-> 1, b |-> TRUE]) : (\E b2023 \in SUBSET {1} : TRUE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 85 of module random_01267
    | <<>>
---*)
