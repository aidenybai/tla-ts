(*---
description: Evaluates a random function expression, seed 262, number 456.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00456 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b754 \in (({-1, -1} = {b755 \in Nat : FALSE}) \ DOMAIN (CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE)) |-> (((<<5, 6>>)[<<1>>] + (<<5, 6>>)[0]) % (IF FALSE THEN -1 ELSE b754 \div (1 % 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00456 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
