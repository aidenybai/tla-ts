(*---
description: Evaluates a random bool expression, seed 262, number 83.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00083 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((LET b128 == 7 IN 2147483647 \in UNION {SUBSET {1}, {1}}) => (~(\A b129 \in {x \in 1..3 : x > 1} : FALSE))) \/ (DOMAIN (0 :> 2) = ((7 + FALSE) .. Cardinality(Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00083 failed.
    Attempted to check if the non-enumerable value
    2147483647
    is element of
    {{}, {1}}
---*)
