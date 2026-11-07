(*---
description: Evaluates a random set expression, seed 262, number 9710.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09710 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b15066 \in (CASE (TRUE = (1 :> 2)) -> (2 % 2) [] OTHER -> (2 * 3) .. CASE (\A b15067 \in 1..3 : FALSE) -> Cardinality(SUBSET {1}) [] OTHER -> (2147483647 * 1)) : ({Head([x \in 1..2 |-> x]), (CHOOSE b15068 \in {1} : TRUE)} \subseteq ((2147483647 * FALSE) .. (b15066 * 2147483647)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09710 failed.
    Attempted to compare equality of boolean TRUE with non-boolean:
    <<2>>
---*)
