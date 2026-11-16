(*---
description: Evaluates a random function expression, seed 262, number 2508.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02508 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3949 \in {(CHOOSE b3951 \in {2, 3} : (\A b3952 \in {1} : FALSE)) : b3950 \in {b3953 \in (2..1 \cup Nat) : (\E b3954 \in {1} : [x \in Nat |-> x + 1])}} |-> IF (CASE FALSE -> -1 [] OTHER -> b3949 \in {2147483647 : b3955 \in 1..3}) THEN CASE (TRUE /\ FALSE) -> CASE TRUE -> b3949 [] OTHER -> b3949 [] OTHER -> Head([x \in Nat |-> x + 1]) ELSE Cardinality({b3956 : b3956 \in SUBSET {1}})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02508 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
