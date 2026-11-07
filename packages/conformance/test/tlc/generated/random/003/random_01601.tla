(*---
description: Evaluates a random set expression, seed 262, number 1601.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01601 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 1] \cup {(2147483647 % 7), (TRUE).a}), (Head(SortSeq(FALSE, LAMBDA p, q : p < q)) .. Head(((1 :> 2) @@ (1 :> 2))))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
