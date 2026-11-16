(*---
description: Evaluates a random set expression, seed 262, number 618.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00618 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((({2, 1, 3} \cap {1}) \cap {b1036 \in {1} : FALSE}) \ {(b1037 - b1037) : b1037 \in DOMAIN [x \in 1..2 |-> x]}), ({(3 + b1038) : b1038 \in DOMAIN [x \in 1..2 |-> x]} \cup UNION {{b1039 \in SUBSET {1} : FALSE}, ({2, 1, 3} \ 2..1)})})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3, 4, 5}"
---*)
