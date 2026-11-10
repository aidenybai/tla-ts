(*---
description: Evaluates a random set expression, seed 262, number 8655.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08655 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({CASE ({1, 2} \subseteq {}) -> Len(<<1, 2>>) [] OTHER -> (b13389 + b13389) : b13389 \in ((2..1 \cap Nat) \cup DOMAIN <<5, 6>>)} \ {IF (TRUE <=> FALSE) THEN (CHOOSE b13391 \in 1..3 : TRUE) ELSE (b13390 % b13390) : b13390 \in ({b13392 \in {x \in 1..3 : x > 1} : FALSE} \cap (1..3 \cup {1}))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 4}"
---*)
