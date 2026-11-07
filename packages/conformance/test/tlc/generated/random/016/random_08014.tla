(*---
description: Evaluates a random set expression, seed 262, number 8014.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08014 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {(SUBSET {1} \ <<5, 6>>), UNION {Nat, {1}}} \cap ({2147483647, 2} \cap UNION {2..1, SUBSET {1}})) \cup (((7 % [x \in 1..2 |-> x]) \div (~TRUE)) .. IF ([a |-> 1] = TRUE) THEN (<<1, 2>>)[3] ELSE (7 \div 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08014 failed.
    Attempted to check if the non-enumerable value
    2147483647
    is element of
    {{}, {1}}
---*)
