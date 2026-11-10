(*---
description: Evaluates a random record expression, seed 262, number 474.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00474 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF ((3 \in SUBSET {1}) <=> (TRUE => FALSE)) THEN [(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = Len(<<1, 2>>)] ELSE ([a |-> 0, b |-> FALSE]).a, b |-> (~((\A b786 \in Nat : TRUE) => (\E b787 \in {1, 2} : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00474 failed.
    Attempted to check if the non-enumerable value
    3
    is element of
    {{}, {1}}
---*)
