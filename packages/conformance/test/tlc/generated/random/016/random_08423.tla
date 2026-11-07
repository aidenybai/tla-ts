(*---
description: Evaluates a random record expression, seed 262, number 8423.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08423 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> CASE ([a |-> 1] = [x \in Nat |-> x + 1]) -> LET b13037 == -1 IN [x \in Nat |-> x + 1] [] OTHER -> IF TRUE THEN 2 ELSE 3, b |-> (\E b13038 \in {-1 : b13039 \in {}} : (FALSE \/ TRUE))] EXCEPT !.a = @ + (((FALSE <=> FALSE) + (1 * <<3, 1, 2>>)) % ((-1 % 1) % IF TRUE THEN 3 ELSE [x \in Nat |-> x + 1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08423 failed.
    Attempted to compute the number of elements in the overridden value Nat.
---*)
