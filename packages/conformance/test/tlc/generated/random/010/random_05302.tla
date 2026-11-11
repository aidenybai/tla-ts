(*---
description: Evaluates a random set expression, seed 262, number 5302.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05302 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b8206 == ((-1 * 3) * CASE FALSE -> 7 [] OTHER -> 2147483647) IN ((b8206 \div 2) * (b8206 % 0)), (Cardinality(({2, 1, 3} \cup Nat)) % LET b8207 == Head(FALSE) IN (-1 - 0))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05302 failed.
    2178:0 Overflow when computing -3*2147483647
---*)
