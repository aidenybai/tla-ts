(*---
description: Evaluates a random int expression, seed 262, number 1745.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01745 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(<<IF (2 = 2) THEN Head(<<>>) ELSE (CHOOSE b2771 \in {2, 1, 3} : TRUE), (CASE TRUE -> 1 [] OTHER -> 0 % ([a |-> 1]).a)>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
