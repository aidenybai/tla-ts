(*---
description: Evaluates a random int expression, seed 262, number 12.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00012 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((<<3, 1..3>> = [b16 \in {1} |-> 0]) <=> ((TRUE => FALSE) => (TRUE /\ TRUE))) THEN (Len(SubSeq(<<1, 2>>, 2147483647, 0)) + ((1 * 1) % LET b17 == 1 IN b17)) ELSE (-Head(SortSeq(<<1>>, LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
