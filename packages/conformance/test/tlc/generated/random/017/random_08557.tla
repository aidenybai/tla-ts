(*---
description: Evaluates a random int expression, seed 262, number 8557.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08557 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq(SelectSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0), IF (2147483647 = -1) THEN (<<5, 6>>)[0] ELSE (2 - 2147483647), ((<<5, 6>>)[7] % [a |-> 2, b |-> TRUE]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08557 failed.
    Attempted to access index 7 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
