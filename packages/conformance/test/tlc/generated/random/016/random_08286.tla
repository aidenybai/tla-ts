(*---
description: Evaluates a random int expression, seed 262, number 8286.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08286 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SelectSeq(<<>>, LAMBDA e : e > 0))).a - (IF (2 \in 2..1) THEN (-7) ELSE (TRUE \div 3) % LET b12831 == (2147483647 - -1) IN (CHOOSE b12832 \in 1..3 : <<>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
