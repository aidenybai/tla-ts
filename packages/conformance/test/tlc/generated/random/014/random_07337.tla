(*---
description: Evaluates a random set expression, seed 262, number 7337.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07337 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<3, 1, 2>>) - (7 - 0)) % LET b11292 == CASE TRUE -> 2 [] OTHER -> [x \in 1..2 |-> x] IN ([a |-> 1, b |-> TRUE]).a) .. (IF Append(<<3, 1, 2>>, -1) THEN (7 \div 3) ELSE (7 - 2147483647) - ([a |-> 2147483647, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07337 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 144 to line 14, col 244 of module random_07337
---*)
