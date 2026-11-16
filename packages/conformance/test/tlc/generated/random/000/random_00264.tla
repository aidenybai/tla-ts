(*---
description: Evaluates a random set expression, seed 262, number 264.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00264 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((<<1, 2>> \cup TRUE) = (0 .. 3)) -> IF (<<3, 1, 2>> = [x \in Nat |-> x + 1]) THEN (1 - 3) ELSE (CHOOSE b442 \in 2..1 : FALSE) [] OTHER -> UNION {(3 .. -1), ({} \ {})} .. ((([x \in Nat |-> x + 1] - [a |-> 1]) % (-1 + 7)) + ([a |-> 7, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00264 failed.
    Attempted to enumerate S \cup T when S:
    <<1, 2>>
    and T:
    TRUE
    are not both enumerable
---*)
