(*---
description: Evaluates a random record expression, seed 262, number 3707.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03707 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((([a |-> 1]).a \div (CHOOSE b5855 \in {x \in 1..3 : x > 1} : TRUE)) - (IF TRUE THEN 3 ELSE 2 \div (7 % 7))), b |-> (\E b5856 \in ((SUBSET {1} \ Nat) \cap {b5857 \in {1, 2} : TRUE}) : (Head(<<3, 1, 2>>) = CASE FALSE -> b5856 [] OTHER -> b5856))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03707 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
