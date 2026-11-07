(*---
description: Evaluates a random set expression, seed 262, number 5370.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05370 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({IF (b8302 \in {}) THEN (b8302 % b8302) ELSE Len(<<1>>) : b8302 \in (LET b8303 == -1 IN -1 .. (0 - 3))} \cup {b8304 \in ({b8305 \in 1..3 : TRUE} \cup (-1 .. -1)) : (({} \cap {}) = {b8306 \in {1, 2} : FALSE})}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-1, 1, 2, 3}"
---*)
