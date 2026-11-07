(*---
description: Evaluates a random function expression, seed 262, number 8394.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08394 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12990 \in (LET b12991 == CASE TRUE -> 3 [] OTHER -> <<3, 1, 2>> IN Head(<<>>) \cup [SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = CASE FALSE -> 1 [] OTHER -> 0]) |-> ((-LET b12992 == 2147483647 IN b12990) % LET b12993 == Head(<<1>>) IN (b12990 % b12993))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
