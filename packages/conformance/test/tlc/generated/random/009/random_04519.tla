(*---
description: Evaluates a random seq expression, seed 262, number 4519.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04519 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((Tail([<<1>> EXCEPT ![1] = TRUE]) \o SelectSeq([a |-> 1, b |-> TRUE], LAMBDA e : e > 0)), CASE (\A b7104 \in (Nat \cup 1..3) : (\E b7105 \in SUBSET {1} : FALSE)) -> ((-1 - 1) % (<<5, 6>>)[-1]) [] OTHER -> SubSeq(<<3, 7>>, (0 .. 3), Len(<<1>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
