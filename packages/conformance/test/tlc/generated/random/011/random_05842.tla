(*---
description: Evaluates a random set expression, seed 262, number 5842.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05842 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(Len((1 \o <<1>>)) .. ((0 % 2) - Head(<<1>>))), ({b9008 \in (1 * 0) : (2 < b9008)} .. {b9009 \in ({2, 1, 3} \cup {1}) : (<<3, 1, 2>> = {1})})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    1
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    1
---*)
