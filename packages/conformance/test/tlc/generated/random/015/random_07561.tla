(*---
description: Evaluates a random set expression, seed 262, number 7561.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07561 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN ((7 :> 2147483647) @@ [[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 0]) \cap SortSeq(Tail((<<1>> @@ <<5, 6>>)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
