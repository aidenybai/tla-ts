(*---
description: Evaluates a random set expression, seed 262, number 8263.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08263 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN ((7 * 0) :> Len(<<1, 2>>)), (CASE (2147483647 = [x \in Nat |-> x + 1]) -> (3 + 0) [] OTHER -> CASE FALSE -> 1 [] OTHER -> -1 \in {([a |-> 1]).a : b12796 \in (1..3 \cup 2..1)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08263 failed.
    Attempted to check equality of integer 2147483647 with non-integer:
    [x \in Nat |-> <expression line 14, col 93 to line 14, col 97 of module random_08263>]
---*)
