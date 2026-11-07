(*---
description: Evaluates a random bool expression, seed 262, number 6609.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06609 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SubSeq(SubSeq(<<>>, 2, 0), (1 + 2147483647), (1 + 2147483647))) \in ({(0 \div b10138) : b10138 \in {1, 7}} \cap {IF TRUE THEN 2147483647 ELSE 7 : b10139 \in (1 .. FALSE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
