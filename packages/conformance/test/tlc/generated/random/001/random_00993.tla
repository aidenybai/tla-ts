(*---
description: Evaluates a random seq expression, seed 262, number 993.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00993 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([SelectSeq(SubSeq(<<1>>, 0, 3), LAMBDA e : e > 0) EXCEPT ![1] = SubSeq([<<3, 1, 2>> EXCEPT ![1] = 1], Head(<<1>>), (-1 \div 1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    0
---*)
