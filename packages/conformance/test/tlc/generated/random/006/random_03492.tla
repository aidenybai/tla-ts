(*---
description: Evaluates a random set expression, seed 262, number 3492.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03492 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((~FALSE) <=> (2 \in {1})) -> Head(SubSeq(<<3, 1, 2>>, -1, 1)) [] OTHER -> ((CHOOSE r \in [a : {1}] : TRUE)).a .. CASE ((2..1 \cap Nat) \in DOMAIN [x \in Nat |-> x + 1]) -> (-(3 - 2147483647)) [] OTHER -> (CHOOSE b5518 \in UNION {Nat, {2, 1, 3}} : (7 \in 1..3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
---*)
