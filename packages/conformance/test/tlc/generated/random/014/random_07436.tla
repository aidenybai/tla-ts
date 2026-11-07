(*---
description: Evaluates a random int expression, seed 262, number 7436.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07436 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head([[SubSeq(<<3, 1, 2>>, 2, 0) EXCEPT ![1] = Head(<<1, 2>>)] EXCEPT ![1] = CASE ((1 :> 2) \/ TRUE) -> (3 \div 1) [] OTHER -> CASE TRUE -> 3 [] OTHER -> 7]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 23 to line 14, col 47 of module random_07436
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 22 to line 14, col 77 of module random_07436
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
