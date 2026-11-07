(*---
description: Evaluates a random bool expression, seed 262, number 3114.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03114 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b4974 \in {([a |-> 1]).a, ([x \in Nat |-> x + 1])[2147483647]} : ((TRUE /\ FALSE) \/ (~FALSE))) = IF (([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) <=> (FALSE /\ TRUE)) THEN (CHOOSE b4975 \in {b4976 \in 2..1 : TRUE} : (TRUE => [a |-> 1])) ELSE LET b4977 == (3 - 7) IN Head(<<1>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
