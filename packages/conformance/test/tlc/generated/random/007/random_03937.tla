(*---
description: Evaluates a random record expression, seed 262, number 3937.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03937 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = @ + Head(<<>>)] EXCEPT !.a = (Head(<<1, 2>>) * IF FALSE THEN 7 ELSE 2147483647)] EXCEPT !.a = @ + (LET b6200 == (1 + 3) IN Cardinality(1..3) + Head(Append(<<3, 1, 2>>, 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
