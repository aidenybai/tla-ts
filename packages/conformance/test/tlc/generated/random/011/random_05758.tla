(*---
description: Evaluates a random seq expression, seed 262, number 5758.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05758 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(Append(SelectSeq(<<1>>, LAMBDA e : e > 0), IF TRUE THEN -1 ELSE 7), Head(Append(<<>>, 3))) \o [[SubSeq(<<1, 2>>, 3, -1) EXCEPT ![1] = CASE TRUE -> 7 [] OTHER -> 2147483647] EXCEPT ![1] = ((CHOOSE r \in [a : 2..1] : TRUE)).a]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 120 to line 14, col 142 of module random_05758
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 119 to line 14, col 195 of module random_05758
    | <<1, -1, 3>>
---*)
