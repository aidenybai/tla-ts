(*---
description: Evaluates a random bool expression, seed 262, number 4103.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04103 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([b6446 \in [a |-> 1] |-> 2147483647])[Len(<<3, 1, 2>>)] :> (-CASE FALSE -> -1 [] OTHER -> 2)) \/ (((3 \in Nat) <=> (TRUE => [a |-> 1])) => (\A b6447 \in DOMAIN (1 :> 2) : (TRUE /\ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04103 failed.
    Attempted to check if element:
    3
    is in the record:
    [a |-> 1]
---*)
