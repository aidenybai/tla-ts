(*---
description: Evaluates a random seq expression, seed 262, number 3343.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03343 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq(SelectSeq(<<2147483647, -1>>, LAMBDA e : e > 0), IF (2147483647 < 1) THEN (2147483647 \div 7) ELSE Len(<<1>>), CASE (TRUE \/ FALSE) -> IF FALSE THEN -1 ELSE -1 [] OTHER -> CASE FALSE -> 2 [] OTHER -> -1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03343 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
