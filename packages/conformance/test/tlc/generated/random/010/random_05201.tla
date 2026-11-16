(*---
description: Evaluates a random function expression, seed 262, number 5201.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05201 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8065 \in {(-(CHOOSE b8067 \in 1..3 : TRUE)) : b8066 \in ({b8068 \in SUBSET {1} : TRUE} \cap {2, 3})} |-> ([(CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE) EXCEPT ![SelectSeq(<<>>, LAMBDA e : e > 0)] = (CHOOSE b8069 \in Nat : FALSE)])[CASE (2 < 3) -> LET b8070 == 0 IN b8065 [] OTHER -> (CHOOSE b8071 \in {1, 2} : TRUE)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05201 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
