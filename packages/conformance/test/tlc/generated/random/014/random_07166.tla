(*---
description: Evaluates a random function expression, seed 262, number 7166.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07166 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(SubSeq(<<1>>, 1, 2)) - (IF FALSE THEN 7 ELSE 3 \div Head(<<3, 1, 2>>))) :> (((3 :> 7))[(-1 - 2)] * (IF TRUE THEN 3 ELSE 7 - (-1 \div 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2
---*)
