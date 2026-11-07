(*---
description: Evaluates a random record expression, seed 262, number 6903.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06903 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (IF (<<1, 2>> = [x \in 1..2 |-> x]) THEN Head(<<1, 2>>) ELSE IF FALSE THEN 3 ELSE 0 \div (Len(<<>>) * (-1 \div 2))), b |-> ((Head(<<>>) - ((1 :> 2))[2]) \in {b10571 \in {b10572 \in {1} : FALSE} : (TRUE <=> TRUE)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
