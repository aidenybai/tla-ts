(*---
description: Evaluates a random seq expression, seed 262, number 3071.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03071 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq((<<>> \o <<1>>), LAMBDA p, q : p < q) \o <<([a |-> 1, b |-> TRUE]).a, CASE FALSE -> 3 [] OTHER -> 2>>) \o [SortSeq((<<>> \o <<>>), LAMBDA p, q : p < q) EXCEPT ![1] = ((7 % 0) \div (1 - 0))]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 133 to line 14, col 176 of module random_03071
    | <<1, 1, 2>>
---*)
