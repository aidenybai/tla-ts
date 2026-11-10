(*---
description: Evaluates a random record expression, seed 262, number 4787.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04787 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 2, b |-> FALSE] EXCEPT !.a = (<<5, 6>>)[2147483647]] EXCEPT !.a = (LET b7475 == 2147483647 IN 1..3 - IF TRUE THEN 2147483647 ELSE 7)] EXCEPT !.a = (-Head(SelectSeq(<<1>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04787 failed.
    Attempted to access index 2147483647 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
