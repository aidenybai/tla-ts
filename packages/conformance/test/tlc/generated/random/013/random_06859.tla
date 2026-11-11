(*---
description: Evaluates a random int expression, seed 262, number 6859.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06859 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b10516 \in {CASE FALSE -> 0 [] OTHER -> b10517 : b10517 \in {b10518 \in {2, 1, 3} : FALSE}} |-> ([[x \in 1..2 |-> x] EXCEPT ![b10516] = b10516])[(3 - b10516)]])[(Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) % CASE (<<1, 2>> = <<5, 6>>) -> Cardinality({2, 1, 3}) [] OTHER -> (2147483647 \div 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06859 failed.
    2179:0 The second argument of \div is 0.
---*)
