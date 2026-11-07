(*---
description: Evaluates a random function expression, seed 262, number 9382.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09382 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0)) :> CASE (UNION {Nat, Nat} \ ([a |-> 1] \cup 2..1)) -> Cardinality((-1 .. 2147483647)) [] OTHER -> ([b14559 \in {1} |-> 3])[Head(<<1, 2>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
