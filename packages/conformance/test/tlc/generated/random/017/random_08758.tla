(*---
description: Evaluates a random record expression, seed 262, number 8758.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08758 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (-2147483647), b |-> (7 = 3)] EXCEPT !.a = @ + Len(Tail(<<>>))] EXCEPT !.a = @ + (LET b13556 == (2147483647 % 2) IN Head(<<>>) \div SubSeq((<<1>> \o <<3, 1, 2>>), CASE FALSE -> 1 [] OTHER -> 0, (-1 % 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
