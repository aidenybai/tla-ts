(*---
description: Evaluates a random set expression, seed 262, number 8128.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08128 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len([[<<1, 2>> EXCEPT ![1] = 7] EXCEPT ![1] = Cardinality(Nat)]), SubSeq(Tail([[a |-> 1] EXCEPT ![1] = 1]), (CASE FALSE -> 2147483647 [] OTHER -> 3 * Len(<<3, 1, 2>>)), IF (<<>> < 2147483647) THEN (2 - 0) ELSE IF FALSE THEN 2147483647 ELSE 7)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08128 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
