(*---
description: Evaluates a random int expression, seed 262, number 5548.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05548 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[b8583 \in ({1, 2} \cap {}) |-> ([x \in Nat |-> x + 1])[b8583]] EXCEPT ![(IF <<5, 6>> THEN 0 ELSE [x \in 1..2 |-> x] + (1 + 7))] = (-(1 - 1))] EXCEPT ![Len(SelectSeq((<<1, 2>> \o <<1>>), LAMBDA e : e > 0))] = (((CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE) @@ (CHOOSE f \in [{1, 2} \cap {2} -> 1..2] : TRUE)))[Cardinality(UNION {1..3, Nat})]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05548 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 92 to line 14, col 143 of module random_05548
---*)
