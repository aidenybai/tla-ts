(*---
description: Evaluates a random bool expression, seed 262, number 341.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00341 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b572 \in (({x \in 1..3 : x > 1} \cap {1, 2}) \cup {b573 : b573 \in {2, 1, 3}}) : (\A b574 \in DOMAIN [x \in 1..2 |-> x] : ([a |-> 1] = <<5, 6>>))) < ((Len(<<1>>) * LET b575 == 7 IN b575) \div Head(SubSeq(<<1, 2>>, 7, 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00341 failed.
    Attempted to check equality of record:
    [a |-> 1]
    with non-record
    <<5, 6>>
---*)
