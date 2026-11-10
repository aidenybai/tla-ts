(*---
description: Evaluates a random int expression, seed 262, number 2592.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02592 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (~(<<1>> => FALSE)) -> ([[x \in Nat |-> x + 1] EXCEPT ![-1] = 2])[CASE <<3, 1, 2>> -> 0 [] OTHER -> 2147483647] [] OTHER -> ({b4087 : b4087 \in {2, 1, 3}})[Cardinality({})] + (LET b4088 == CASE FALSE -> -1 [] OTHER -> 3 IN (3 \div 0) % LET b4089 == Cardinality({x \in 1..3 : x > 1}) IN (b4089 * b4089))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02592 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a tuple.
    line 14, col 25 to line 14, col 38 of module random_02592
---*)
