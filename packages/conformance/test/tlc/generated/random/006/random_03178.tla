(*---
description: Evaluates a random bool expression, seed 262, number 3178.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03178 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b5058 \in {b5059 \in {(1 * b5060) : b5060 \in ({1, 2} \ SUBSET {1})} : ((0 .. b5059) = {b5061 \in {2, 1, 3} : TRUE})} : ({(CHOOSE b5062 \in {1} : FALSE), IF TRUE THEN b5058 ELSE 7} = (({1, 2} \cup 2..1) \cap (b5058 * b5058)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03178 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
