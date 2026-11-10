(*---
description: Evaluates a random function expression, seed 262, number 9566.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09566 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14854 \in (DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![2] = 2147483647] \cup ((2..1 \cap Nat) \cup {7, 1})) |-> (Len(({x \in 1..3 : x > 1} \cap SUBSET {1})) * IF (TRUE <=> TRUE) THEN (<<1>> \o <<3, 1, 2>>) ELSE CASE FALSE -> -1 [] OTHER -> 2147483647)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b14854 \\in {1, 7} \\cup Nat |-> <expression line 14, col 126 to line 14, col 262 of module random_09566>]"
---*)
