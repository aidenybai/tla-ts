(*---
description: Evaluates a random record expression, seed 262, number 5795.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05795 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = Len(<<>>)] EXCEPT !.a = @ + (Head(<<1>>) + LET b8937 == 3 IN b8937)] EXCEPT !.a = Cardinality({IF TRUE THEN 2 ELSE 7, (2 * 2147483647)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2*2147483647
    2178:0 Overflow when computing 2*2147483647
---*)
