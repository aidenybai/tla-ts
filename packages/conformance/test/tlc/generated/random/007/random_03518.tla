(*---
description: Evaluates a random record expression, seed 262, number 3518.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03518 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF ((CHOOSE r \in [a : {1}] : TRUE)).a THEN (CHOOSE b5556 \in (1..3 \ {2, 1, 3}) : (\A b5557 \in {} : [x \in Nat |-> x + 1])) ELSE ((-1) \div LET b5558 == 2147483647 IN b5558), b |-> ((DOMAIN 2147483647 \ ({2, 1, 3} \cap {})) => ((0 * 7) < (1 % 7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03518 failed.
    A non-boolean expression (an integer) was used as the condition of an IF.
    line 14, col 23 to line 14, col 197 of module random_03518
---*)
