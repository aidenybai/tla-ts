(*---
description: Evaluates a random int expression, seed 262, number 6152.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06152 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((TRUE => TRUE) /\ (TRUE => FALSE)) THEN (Head(<<1>>) + CASE TRUE -> -1 [] OTHER -> 2) ELSE (Cardinality([a |-> 1]) % (CHOOSE b9463 \in 1..3 : FALSE)) * CASE ((7 = 0) <=> ({} = {x \in 1..3 : x > 1})) -> (Head(<<1>>) % IF TRUE THEN 2 ELSE 3) [] OTHER -> (-(2 * 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1]
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1]
---*)
