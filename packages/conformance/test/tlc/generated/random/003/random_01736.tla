(*---
description: Evaluates a random seq expression, seed 262, number 1736.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01736 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Append([SubSeq(<<1, 2>>, 3, 2) EXCEPT ![1] = CASE FALSE -> 2 [] OTHER -> 3], Cardinality((2 .. -1)))))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 29 to line 14, col 50 of module random_01736
    | <<>>
---*)
