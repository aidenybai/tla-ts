(*---
description: Evaluates a random seq expression, seed 262, number 1963.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01963 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(Tail((<<1, 2>> \o <<1>>)), (-LET b3103 == 2147483647 IN b3103)), (CHOOSE b3104 \in DOMAIN [b3105 \in {1, 2} |-> 3] : ([b3104 EXCEPT ![1] = b3104] = DOMAIN <<5, 6>>)), Cardinality(((1..3 \ {x \in 1..3 : x > 1}) \cup (7 \ {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01963 failed.
    Attempted to apply EXCEPT construct to the value 1.
---*)
