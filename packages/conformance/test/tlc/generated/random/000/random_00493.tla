(*---
description: Evaluates a random record expression, seed 262, number 493.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00493 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ((Nat \cup 1..3) \subseteq {7, 2}) -> ((7 * 7) * Cardinality({1, 2})) [] OTHER -> ((2147483647 * 1) % (1 - 2147483647)), b |-> (\E b812 \in {b813 \in {3 : b814 \in 1..3} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])} : ((-b812) < (CHOOSE b815 \in Nat : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00493 failed.
    Attempted to enumerate S \cup T when S:
    1..3
    and T:
    Nat
    are not both enumerable
---*)
