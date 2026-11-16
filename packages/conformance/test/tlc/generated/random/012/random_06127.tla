(*---
description: Evaluates a random set expression, seed 262, number 6127.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06127 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((3 * 2147483647) * Cardinality(2..1)) * IF (FALSE \/ <<5, 6>>) THEN (7 + 1) ELSE [[a |-> 1] EXCEPT !.a = @ + -1]), IF (CASE FALSE -> -1 [] OTHER -> 1 \in (7 .. -1)) THEN Len([<<1>> EXCEPT ![1] = 2]) ELSE ([[a |-> 1] EXCEPT !.a = 3]).a})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06127 failed.
    2178:0 Overflow when computing 3*2147483647
---*)
