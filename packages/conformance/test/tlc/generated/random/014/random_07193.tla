(*---
description: Evaluates a random set expression, seed 262, number 7193.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07193 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b11054 \in {(CASE FALSE -> 1 [] OTHER -> 7 \div Cardinality({x \in 1..3 : x > 1})), (Cardinality({x \in 1..3 : x > 1}) % (2147483647 - -1))} : (Append(Append(<<1>>, b11054), ([a |-> 1, b |-> TRUE]).a) = IF DOMAIN [x \in 1..2 |-> x] THEN IF TRUE THEN b11054 ELSE -1 ELSE (-1 - -1))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647--1
    2178:0 Overflow when computing 2147483647--1
---*)
