(*---
description: Evaluates a random bool expression, seed 262, number 8136.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08136 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1] EXCEPT !.a = 2] = (CHOOSE b12569 \in SUBSET {1} : TRUE)) /\ ((-1 % 2147483647) \in {2147483647, 0})) /\ (~((\A b12570 \in {1, 2} : TRUE) => ([a |-> 1] = [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08136 failed.
    Attempted to check equality of record:
    [a |-> 2]
    with non-record
    {}
---*)
