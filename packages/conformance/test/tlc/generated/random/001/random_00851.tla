(*---
description: Evaluates a random seq expression, seed 262, number 851.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00851 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq(SelectSeq(Tail(<<1>>), LAMBDA e : e > 0), LET b1389 == (7 * 7) IN (2147483647 % b1389), Len(Tail(<<1>>))) EXCEPT ![1] = ([[[a |-> 1] EXCEPT !.a = @ + 0] EXCEPT !.a = (3 \div 3)]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 128 of module random_00851
    | <<>>
---*)
