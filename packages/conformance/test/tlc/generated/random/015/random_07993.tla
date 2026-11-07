(*---
description: Evaluates a random set expression, seed 262, number 7993.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07993 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(Tail(Append(<<1>>, 2147483647))) .. ((CASE FALSE -> 2147483647 [] OTHER -> 3 % ([a |-> 1]).a) - (([x \in Nat |-> x + 1])[2147483647] + (7 + 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
