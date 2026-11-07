(*---
description: Evaluates a random seq expression, seed 262, number 4196.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04196 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] = [[a |-> 1] EXCEPT !.a = @ + 2147483647]) -> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]).a [] OTHER -> Len((2 .. 7)), (((CHOOSE f \in [{1, 2} -> {1, 2}] : TRUE) @@ [[x \in 1..2 |-> x] EXCEPT ![<<3, 1, 2>>] = 2]))[(-(-3))]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
