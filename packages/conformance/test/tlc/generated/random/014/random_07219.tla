(*---
description: Evaluates a random bool expression, seed 262, number 7219.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07219 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality(DOMAIN [x \in Nat |-> x + 1]) < CASE (TRUE => TRUE) -> CASE TRUE -> 2147483647 [] OTHER -> 2147483647 [] OTHER -> (2147483647 * 2)) \/ (UNION {(<<1>> \cup Nat), {2, 2}} \subseteq ((2147483647 - 7) .. Len(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
