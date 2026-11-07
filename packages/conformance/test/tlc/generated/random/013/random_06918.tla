(*---
description: Evaluates a random set expression, seed 262, number 6918.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06918 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b10588 \in (UNION {Nat, [a |-> 1, b |-> TRUE]} \cup (3 .. 7)) : (({} \cap 1..3) = UNION {{1}, {}})} \cap ((Tail(<<>>) .. (1 - 0)) \cup {Cardinality(2..1) : b10589 \in ({x \in 1..3 : x > 1} \cup 2..1)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
