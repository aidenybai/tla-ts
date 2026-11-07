(*---
description: Evaluates a random function expression, seed 262, number 134.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00134 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b210 \in {LET b211 == ([a |-> 1, b |-> TRUE]).a IN (CHOOSE b212 \in {2, 1, 3} : TRUE), (-(-7))} |-> (CHOOSE b213 \in UNION {(2 .. 7), UNION {{}, Nat}} : (CASE FALSE -> 1 [] OTHER -> b210 \in ({} \cup [x \in Nat |-> x + 1])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00134 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {}
---*)
