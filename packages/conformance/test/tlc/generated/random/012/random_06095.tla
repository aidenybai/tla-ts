(*---
description: Evaluates a random seq expression, seed 262, number 6095.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06095 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(((TRUE <=> TRUE) /\ (TRUE => [a |-> 1])) + Head((<<>> \o <<1, 2>>))), (CHOOSE b9380 \in {b9381 \in (2..1 \ SUBSET {1}) : (b9381 \in Nat)} : (\E b9382 \in {0, b9380} : (FALSE /\ FALSE)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06095 failed.
    Attempted to evaluate an expression of form P => Q when Q was
    a record.
    line 14, col 40 to line 14, col 56 of module random_06095
---*)
