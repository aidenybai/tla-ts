(*---
description: Evaluates a random int expression, seed 262, number 2711.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02711 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b4286 == ((3 + 2147483647) + [<<1>> EXCEPT ![1] = 0]) IN IF (TRUE <=> FALSE) THEN IF FALSE THEN b4286 ELSE b4286 ELSE (b4286 * b4286) + (Cardinality(({1, 2} \ Nat))).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 3+2147483647
    2178:0 Overflow when computing 3+2147483647
---*)
