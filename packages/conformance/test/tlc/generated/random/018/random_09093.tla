(*---
description: Evaluates a random int expression, seed 262, number 9093.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09093 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b14128 \in {2, 1, 3} : TRUE) \div (2 + 2147483647)) * LET b14129 == (CHOOSE b14130 \in {x \in 1..3 : x > 1} : FALSE) IN IF FALSE THEN b14129 ELSE b14129) \div ((CHOOSE f \in [{1, 2} -> {}] : TRUE))[Head(<<0, 2147483647>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09093 failed.
    2178:0 Overflow when computing 2+2147483647
---*)
