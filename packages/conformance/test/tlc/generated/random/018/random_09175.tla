(*---
description: Evaluates a random bool expression, seed 262, number 9175.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09175 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> CASE (\A b14244 \in 2..1 : TRUE) -> (3 + 2147483647) [] OTHER -> (-TRUE), b |-> (Head(<<3, 1, 2>>) < (7 \div 7))] /\ ((({1} \ SUBSET {1}) \ ({} \cap {})) = DOMAIN (CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09175 failed.
    2178:0 Overflow when computing 3+2147483647
---*)
