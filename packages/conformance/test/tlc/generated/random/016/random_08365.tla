(*---
description: Evaluates a random function expression, seed 262, number 8365.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08365 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Head(<<-1, 3>>) :> Cardinality((TRUE => TRUE))) EXCEPT ![(IF (2..1 \/ FALSE) THEN Append(<<1>>, 2) ELSE (2 % 2) + ([a |-> 2, b |-> FALSE]).a)] = Head(Tail(Tail(<<3, 1, 2>>)))])
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
