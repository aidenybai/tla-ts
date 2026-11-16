(*---
description: Evaluates a random seq expression, seed 262, number 331.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00331 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([a |-> (-(7 - -1)), b |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] = {b559 \in Nat : TRUE})], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00331 failed.
    Attempted to check equality of record:
    [a |-> 2147483647, b |-> TRUE]
    with non-record
    {b559 \in Nat : <expression line 14, col 119 to line 14, col 122 of module random_00331> }
---*)
