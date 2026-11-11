(*---
description: Evaluates a random set expression, seed 262, number 4039.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04039 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ([a |-> -1, b |-> TRUE] = [1..3 EXCEPT !.a = @ + 3]) -> (-(-2147483647)) [] OTHER -> (CHOOSE b6351 \in DOMAIN [x \in Nat |-> x + 1] : (b6351 = 7)) .. (CASE (TRUE \/ FALSE) -> IF TRUE THEN 2147483647 ELSE [a |-> 1, b |-> TRUE] [] OTHER -> (1 + {2, 1, 3}) * ((\A b6352 \in {2, 1, 3} : FALSE) <=> IF FALSE THEN Nat ELSE 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04039 failed.
    Attempted to apply EXCEPT construct to the value 1..3.
---*)
