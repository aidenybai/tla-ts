(*---
description: Evaluates a random bool expression, seed 262, number 5993.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05993 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b9239 \in (((1..3 \ {1}) \ UNION {SUBSET {1}, FALSE}) \ (Len(<<>>) .. (CHOOSE b9240 \in {} : TRUE))) : (\E b9241 \in ({0, b9239} \cap (3 .. b9239)) : ({b9242 \in {} : FALSE} = {b9239, 1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05993 failed.
    Attempted to compare boolean FALSE with non-boolean:
    {{}, {1}}
---*)
