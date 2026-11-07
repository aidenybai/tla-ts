(*---
description: Evaluates a random set expression, seed 262, number 834.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00834 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({([[a |-> 1] EXCEPT !.a = b1358]).a : b1358 \in (Head(<<>>) .. Len(2..1))} \ UNION {((<<5, 6>> + 7) .. IF TRUE THEN 0 ELSE 2), {([x \in Nat |-> x + 1])[1], (2147483647 - 2)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
