(*---
description: Evaluates a random function expression, seed 262, number 9771.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09771 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(CASE (~FALSE) -> (-2) [] OTHER -> (CHOOSE b15166 \in {x \in 1..3 : x > 1} : TRUE) \div ((-3) - (0 - 1))), (CHOOSE b15167 \in ({-1 : b15168 \in TRUE} \ DOMAIN <<5, 6>>) : ((TRUE /\ TRUE) \/ (~FALSE)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09771 failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 162 to line 14, col 165 of module random_09771
---*)
