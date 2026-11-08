(*---
description: Evaluates a random int expression, seed 262, number 5498.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05498 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len((<<7, 7>> \o {b8502 \in 2..1 : FALSE})) * (Cardinality([[x \in Nat |-> x + 1] EXCEPT ![0] = 7]) % LET b8503 == (2147483647 * 2) IN (1 + b8503))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05498 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {}
---*)
