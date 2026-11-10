(*---
description: Evaluates a random int expression, seed 262, number 393.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00393 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((LET b647 == 1 IN 0 \in ({2, 1, 3} \ SUBSET {1})) => ({-1 : b648 \in {1}} \subseteq (0 .. 2147483647))) -> (((2 * 7) \div LET b649 == 1 IN b649) \div (CHOOSE b650 \in {b651 \in Nat : TRUE} : (SUBSET {1} \subseteq {1}))) [] OTHER -> ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00393 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
