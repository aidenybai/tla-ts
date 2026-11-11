(*---
description: Evaluates a random int expression, seed 262, number 5314.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05314 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((3 + 2147483647) + (CHOOSE b8221 \in [a |-> 1, b |-> TRUE] : FALSE)) \in {(2147483647 % 0), (-1 \div 7)}) THEN ((CHOOSE b8222 \in (2147483647 .. 3) : (2..1 \subseteq Nat)) + ((CHOOSE r \in [a : {}] : TRUE)).a) ELSE ((CHOOSE r \in [a : 1..2] : TRUE)).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05314 failed.
    2178:0 Overflow when computing 3+2147483647
---*)
