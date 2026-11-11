(*---
description: Evaluates a random int expression, seed 262, number 442.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00442 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ({0, 1} = DOMAIN [x \in Nat |-> x + 1]) -> (Len(<<>>) - [a |-> 1, b |-> FALSE]) [] OTHER -> LET b721 == CASE FALSE -> 3 [] OTHER -> 0 IN CASE TRUE -> 2 [] OTHER -> 1 \div Head((SelectSeq(<<1, 2>>, LAMBDA e : e > 0) \o Append(<<1, 2>>, 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00442 failed.
    Attempted to check equality of the set {0, 1} with the value:
    Nat
---*)
