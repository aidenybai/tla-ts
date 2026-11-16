(*---
description: Evaluates a random set expression, seed 262, number 8310.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08310 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({LET b12864 == (2 - [x \in 1..2 |-> x]) IN (FALSE => TRUE) : b12863 \in ((1..3 \ {x \in 1..3 : x > 1}) \cup (FALSE \/ <<1>>))} \cap (CASE (\A b12865 \in {1} : FALSE) -> ([x \in 1..2 |-> x] % 2) [] OTHER -> {b12866 \in <<>> : FALSE} .. Cardinality(DOMAIN (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08310 failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    a tuple.
    line 14, col 126 to line 14, col 139 of module random_08310
---*)
