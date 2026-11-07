(*---
description: Evaluates a random function expression, seed 262, number 4670.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04670 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7301 \in ((UNION {<<5, 6>>, 2..1} \cap (Nat \cap SUBSET {1})) \cap {b7302 \in (1..3 \ {1, 2}) : (<<1, 2>> = <<5, 6>>)}) |-> (-(CHOOSE b7303 \in {b7301, -1} : (\A b7304 \in {} : <<5, 6>>)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
