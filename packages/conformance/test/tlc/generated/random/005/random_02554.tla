(*---
description: Evaluates a random set expression, seed 262, number 2554.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02554 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF (UNION {Nat, {1}} \subseteq {b4031 \in {1, 2} : FALSE}) THEN (([x \in 1..2 |-> x])[0] - CASE TRUE -> [a |-> 1] [] OTHER -> 0) ELSE ((3 \div 2) * IF TRUE THEN 2 ELSE 2147483647), ((-([a |-> 1]).a) % (-(-2147483647)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02554 failed.
    Attempted to compare the set {1} with the value:
    Nat
---*)
