(*---
description: Evaluates a random int expression, seed 262, number 7449.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07449 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(<<LET b11484 == (1 - 1) IN LET b11485 == 3 IN b11484, Append([[a |-> 1] EXCEPT !.a = @ + 1], CASE FALSE -> FALSE [] OTHER -> 7)>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> 2]
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> 2]
---*)
