(*---
description: Evaluates a random int expression, seed 262, number 3006.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03006 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(IF (<<1, 2>> = [x \in 1..2 |-> x]) THEN Head(<<3, 1, 2>>) ELSE Head(<<>>) - (CHOOSE b4777 \in {b4778 : b4778 \in {1, 2}} : (\A b4779 \in {2, 1, 3} : FALSE))), (Head(<<1, 7>>) * Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 1>>"
---*)
