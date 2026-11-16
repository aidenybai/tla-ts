(*---
description: Evaluates a random set expression, seed 262, number 3809.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03809 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{Tail([<<1, 2>> EXCEPT ![1] = -1]) : b6006 \in {(-1 + 2), (-1 * 3)}}, {([b6008 \in 1..3 |-> b6007])[(Nat = SUBSET {1})] : b6007 \in {(<<5, 6>>)[2147483647], {b6009 : b6009 \in Nat}}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03809 failed.
    Attempted to access index 2147483647 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
