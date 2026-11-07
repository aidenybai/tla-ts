(*---
description: Evaluates a random set expression, seed 262, number 587.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00587 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b984 \in ([a |-> Head(<<3, 1, 2>>), b |-> (1..3 = {1, 2})] .. (CHOOSE b985 \in UNION {Nat, {x \in 1..3 : x > 1}} : (TRUE /\ TRUE))) : (CASE ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) -> IF FALSE THEN -1 ELSE 2147483647 [] OTHER -> ([a |-> 1, b |-> TRUE]).a = LET b986 == (-3) IN (0 + b986))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00587 failed.
    Attempted to compare the set {2, 3} with the value:
    Nat
---*)
