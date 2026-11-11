(*---
description: Evaluates a random set expression, seed 262, number 772.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00772 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE (Tail(<<3, 1, 2>>) = DOMAIN <<5, 6>>) -> ((b1262 * 0) + (CHOOSE b1263 \in {} : FALSE)) [] OTHER -> Cardinality({b1264 \in {1, 2} : TRUE}) : b1262 \in (DOMAIN (CHOOSE f \in [{1} -> {1, 2} \ {1}] : TRUE) \cup UNION {({} \cap {1, 2}), ({x \in 1..3 : x > 1} \ {1})})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00772 failed.
    Attempted to check equality of the function <<1, 2>> with the value:
    1..2
---*)
