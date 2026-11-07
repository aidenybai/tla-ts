(*---
description: Evaluates a random int expression, seed 262, number 782.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00782 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (\A b1288 \in (([x \in Nat |-> x + 1])[3] .. ([a |-> 1, b |-> TRUE]).a) : (([a |-> 1] = [a |-> 1, b |-> TRUE]) => (~TRUE))) THEN (((2147483647 * 7) * CASE FALSE -> 2 [] OTHER -> 2) \div ((2 * 3) % (-0))) ELSE (-[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = (-3)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647*7
    2178:0 Overflow when computing 2147483647*7
---*)
