(*---
description: Evaluates a random set expression, seed 262, number 9840.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09840 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(SubSeq(({} \ 2), (2147483647 - 2147483647), (0 * 2147483647))), (-(-Head(<<3, 1, 2>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    {}
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    {}
---*)
