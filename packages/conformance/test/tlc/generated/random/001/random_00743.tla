(*---
description: Evaluates a random record expression, seed 262, number 743.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00743 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + (((1 \div 7) \div IF FALSE THEN 0 ELSE 2147483647) + Len([<<>> EXCEPT ![1] = 7]))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 125 to line 14, col 128 of module random_00743
    | [a |-> 1]
---*)
