(*---
description: Evaluates a random int expression, seed 262, number 5521.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05521 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b8533 \in {(CHOOSE b8534 \in (-1 .. 7) : (<<3, 1, 2>> = SUBSET {1})), (-(2 - [x \in Nat |-> x + 1]))} : ([a |-> ([x \in Nat |-> x + 1])[1], b |-> (<<1>> = [x \in 1..2 |-> x])] \/ (Len(<<1>>) = LET b8535 == Nat IN 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05521 failed.
    Attempted to check equality of the function <<3, 1, 2>> with the value:
    {{}, {1}}
---*)
