(*---
description: Evaluates a random set expression, seed 262, number 8132.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08132 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len(SubSeq((<<1>> \o <<>>), (1 - 0), CASE TRUE -> FALSE [] OTHER -> 7)), ((-CASE TRUE -> 0 [] OTHER -> 0) % ([b12562 \in 2..1 |-> b12562])[(7 + 2147483647)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08132 failed.
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    FALSE
---*)
