(*---
description: Evaluates a random set expression, seed 262, number 9459.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09459 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ([FALSE EXCEPT !.a = @ + 3] = [b14690 EXCEPT !.a = @ + 0]) -> Head(Tail(<<3, 1, 2>>)) [] OTHER -> LET b14691 == (-7) IN Cardinality(1..3) : b14690 \in {LET b14693 == (b14692 - 3) IN Len(<<1>>) : b14692 \in {Cardinality({1}) : b14694 \in ({1} \ {1})}}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
