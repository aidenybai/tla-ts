(*---
description: Evaluates a random set expression, seed 262, number 3887.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03887 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ((TRUE \/ TRUE) => (1 < 0)) -> CASE (~TRUE) -> (0 - 3) [] OTHER -> Head(<<1, 2>>) [] OTHER -> Cardinality((TRUE /\ TRUE)), Head(<<CASE FALSE -> 0 [] OTHER -> 1, ([a |-> 1, b |-> TRUE]).a>>)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    TRUE
    2181:0 Attempted to compute cardinality of the value
    TRUE
---*)
