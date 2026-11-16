(*---
description: Evaluates a random int expression, seed 262, number 5246.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05246 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b8123 == Head([Tail(<<1, 2>>) EXCEPT ![1] = (-2)]) IN IF ([[a |-> 1] EXCEPT !.a = @ + b8123] = [[a |-> 1] EXCEPT !.a = @ + 0]) THEN ([[a |-> 1] EXCEPT !.a = 1]).a ELSE IF (b8123 \in SUBSET {1}) THEN (-1 \div 1) ELSE Len(<<1, 2>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05246 failed.
    Attempted to check if the non-enumerable value
    -2
    is element of
    {{}, {1}}
---*)
