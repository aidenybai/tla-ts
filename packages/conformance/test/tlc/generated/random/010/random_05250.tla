(*---
description: Evaluates a random function expression, seed 262, number 5250.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05250 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((2147483647 .. 2147483647) \ UNION {SUBSET {1}, {1}}) :> IF [b8127 \in Nat |-> 3] THEN ((1 :> 2) + 2) ELSE (3 - 0)) EXCEPT ![([a |-> Len(<<1, 2>>), b |-> (FALSE => TRUE)]).a] = (-([[a |-> 1] EXCEPT !.a = @ + 0]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05250 failed.
    Attempted to check if the non-enumerable value
    2147483647
    is element of
    {{}, {1}}
---*)
