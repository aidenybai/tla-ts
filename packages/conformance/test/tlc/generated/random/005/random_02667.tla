(*---
description: Evaluates a random function expression, seed 262, number 2667.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02667 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4210 \in (Head((<<1, 2>> \o <<3, 1, 2>>)) .. Head(SubSeq(<<>>, FALSE, 0))) |-> ([b4211 \in ({1, 2} \cup {1}) |-> IF TRUE THEN b4210 ELSE b4210] + Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02667 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    FALSE
---*)
