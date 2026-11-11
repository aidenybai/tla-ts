(*---
description: Evaluates a random set expression, seed 262, number 728.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00728 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {{7, 2147483647}, {b1198 \in 2..1 : FALSE}} \ (DOMAIN [x \in 1..2 |-> x] \cap (7 .. 3))) \cap {Len(<<3, -1>>), ((7 + 2147483647) % (CHOOSE b1199 \in Nat : TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00728 failed.
    2178:0 Overflow when computing 7+2147483647
---*)
