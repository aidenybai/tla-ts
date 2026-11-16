(*---
description: Evaluates a random set expression, seed 262, number 3119.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03119 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((([TRUE EXCEPT !.a = 2] % IF FALSE THEN 2 ELSE 7) \o <<SubSeq(<<3, 1, 2>>, 2147483647, 3), Len(<<>>)>>), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03119 failed.
    Attempted to apply EXCEPT construct to the value TRUE.
---*)
