(*---
description: Evaluates a random set expression, seed 262, number 9055.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09055 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {(DOMAIN [x \in 1..2 |-> x] \ ({x \in 1..3 : x > 1} \cap {})), UNION {(SUBSET {1} \cap {}), {b14074 : b14074 \in {1, 2}}}} \cup {CASE (~TRUE) -> ((1 :> 2))[b14075] [] OTHER -> ((1 :> 2))[b14075] : b14075 \in {b14076 \in UNION {1..3, {1, 2}} : ({x \in 1..3 : x > 1} = {})}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
