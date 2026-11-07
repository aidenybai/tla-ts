(*---
description: Evaluates a random seq expression, seed 262, number 7950.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07950 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<(Len(FALSE) + IF TRUE THEN -1 ELSE 3), (CASE FALSE -> 2 [] OTHER -> 7 \div IF FALSE THEN 2 ELSE 2)>> EXCEPT ![1] = (((1 % 2) + Len(<<>>)) % ([[a |-> 1] EXCEPT !.a = @ + 0]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    FALSE
    2283:0 The argument of Len should be a sequence, but instead it is:
    FALSE
---*)
