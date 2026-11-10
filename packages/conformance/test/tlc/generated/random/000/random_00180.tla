(*---
description: Evaluates a random set expression, seed 262, number 180.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00180 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({LET b286 == 7 IN b286, (-1 - 0)} \ {[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2], (-2)}) \ UNION {(CASE FALSE -> 2147483647 [] OTHER -> 7 .. (0 * 0)), ([b287 \in Nat |-> b287])[Len(<<3, 1, 2>>)]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00180 failed.
    Attempted to check equality of record:
    [a |-> 3, b |-> TRUE]
    with non-record
    7
---*)
