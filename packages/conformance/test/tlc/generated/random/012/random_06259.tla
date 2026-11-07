(*---
description: Evaluates a random seq expression, seed 262, number 6259.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06259 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SortSeq(((<<1, 2>> \o <<1>>) \o <<-1, FALSE>>), LAMBDA p, q : p < q), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    FALSE
    2266:0 The first argument of < should be an integer, but instead it is:
    FALSE
---*)
