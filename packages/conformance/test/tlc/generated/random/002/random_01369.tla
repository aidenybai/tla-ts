(*---
description: Evaluates a random set expression, seed 262, number 1369.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01369 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-IF (FALSE /\ TRUE) THEN CASE TRUE -> b2185 [] OTHER -> b2185 ELSE (7 - 0)) : b2185 \in UNION {{(2147483647 * b2186) : b2186 \in ({x \in 1..3 : x > 1} \ {1, 2})}, {(-1 - -1), Len(<<3, 1, 2>>)}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647*3
    2178:0 Overflow when computing 2147483647*3
---*)
