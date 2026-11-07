(*---
description: Evaluates a random set expression, seed 262, number 3976.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03976 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality({}) * (3 % 7)) .. (LET b6251 == -1 IN 3 - (-1 * 2147483647))) \ UNION {{(-1 \div 0), IF FALSE THEN 0 ELSE 3}, UNION {([x \in Nat |-> x + 1])[7], {2, 1}}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 3--2147483647
    2178:0 Overflow when computing 3--2147483647
---*)
