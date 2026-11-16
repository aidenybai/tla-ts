(*---
description: Evaluates a random seq expression, seed 262, number 1661.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01661 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([Append([<<1, 2>> EXCEPT ![1] = 0], CASE FALSE -> 2147483647 [] OTHER -> 1) EXCEPT ![1] = Head(SelectSeq(<<>>, LAMBDA e : e > 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01661 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
