(*---
description: Evaluates a random bool expression, seed 262, number 4716.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04716 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b7376 \in UNION {{[[a |-> 1] EXCEPT !.a = 7], Len(<<1>>)}, {b7377 \in ({2, 1, 3} \cap {x \in 1..3 : x > 1}) : (<<3, 1, 2>> = (1 :> 2))}} : (((1 % b7376) \in {3, 3}) /\ ((TRUE = [a |-> 1]) \/ (2..1 = {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04716 failed.
    Attempted to check equality of record:
    [a |-> 7]
    with non-record
    1
---*)
