(*---
description: Evaluates a random seq expression, seed 262, number 9935.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09935 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o [<<3, 1, 2>> EXCEPT ![1] = 3]) EXCEPT ![1] = ([[x \in Nat |-> x + 1] EXCEPT ![-1] = -1])[Cardinality({x \in 1..3 : x > 1})]] EXCEPT ![1] = IF ([[a |-> 1] EXCEPT !.a = @ + 3] = [a |-> 2147483647, b |-> TRUE]) THEN LET b15456 == IF FALSE THEN 1 ELSE 3 IN (1 + b15456) ELSE ((2147483647 - 0) + Cardinality(1..3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 108 to line 14, col 128 of module random_09935
    2178:0 Overflow when computing 2147483647+3
    2178:0 Overflow when computing 2147483647+3
---*)
