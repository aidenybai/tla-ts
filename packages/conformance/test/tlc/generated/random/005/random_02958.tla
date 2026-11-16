(*---
description: Evaluates a random record expression, seed 262, number 2958.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02958 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + IF (Nat \subseteq 1..3) THEN ([a |-> 1]).a ELSE CASE FALSE -> 1 [] OTHER -> 1] EXCEPT !.a = LET b4689 == (Cardinality({x \in 1..3 : x > 1}) * ([x \in Nat |-> x + 1])[-1]) IN Len(Tail(<<>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02958 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 72 to line 14, col 89 of module random_02958
---*)
