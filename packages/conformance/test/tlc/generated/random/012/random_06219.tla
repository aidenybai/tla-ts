(*---
description: Evaluates a random bool expression, seed 262, number 6219.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06219 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (TRUE /\ FALSE) THEN (2 - 2) ELSE Head(<<3, 1, 2>>) * ((3 * 2147483647) \div IF TRUE THEN 1 ELSE -1)) = IF ((2147483647 .. 2) \subseteq (SUBSET {1} \cap -1)) THEN Head([<<3, 1, 2>> EXCEPT ![1] = 3]) ELSE Head(Append(<<1>>, -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 3*2147483647
    2178:0 Overflow when computing 3*2147483647
---*)
