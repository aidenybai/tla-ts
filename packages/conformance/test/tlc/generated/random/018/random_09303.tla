(*---
description: Evaluates a random bool expression, seed 262, number 9303.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09303 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14436 \in {IF (2 = b14437) THEN Tail(<<3, 1, 2>>) ELSE (b14437 + 0) : b14437 \in {(b14438 \div 0) : b14438 \in {b14439 \in {1} : FALSE}}} |-> IF ({b14440 \in Nat : FALSE} \subseteq {7, 3}) THEN (Len(SUBSET {1}) \div (b14436 + 7)) ELSE ((b14436 + -1) + ([a |-> 1, b |-> TRUE]).a)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
