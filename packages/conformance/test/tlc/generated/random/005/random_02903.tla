(*---
description: Evaluates a random record expression, seed 262, number 2903.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02903 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((3 - -1) :> (-0)) EXCEPT !.a = (-SubSeq(TRUE, 3, 7))] EXCEPT !.a = @ + (Len(SelectSeq(<<1>>, LAMBDA e : e > 0)) \div (-(7 + -1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02903 failed.
    Attempted to check equality of integer 4 with non-integer:
    "a"
---*)
