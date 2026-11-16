(*---
description: Evaluates a random bool expression, seed 262, number 977.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00977 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Append(Tail(<<>>), (<<5, 6>>)[1]) = ((3 + 0) :> IF FALSE THEN 7 ELSE 0)) <=> (~(IF FALSE THEN 1 ELSE 0 \in (3 .. 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00977 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
