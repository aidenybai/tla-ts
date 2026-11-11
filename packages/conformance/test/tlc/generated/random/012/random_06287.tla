(*---
description: Evaluates a random int expression, seed 262, number 6287.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06287 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((<<1, 7>> \o <<2, 7>>) = ((0 * 2) :> (<<5, 6>>)[3])) THEN Cardinality((UNION {{}, {x \in 1..3 : x > 1}} \ (2 .. 0))) ELSE (Len(Tail(<<3, 1, 2>>)) % LET b9673 == Cardinality({1, 2}) IN (7 % 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06287 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
