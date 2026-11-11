(*---
description: Evaluates a random set expression, seed 262, number 781.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00781 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {(DOMAIN [x \in Nat |-> x + 1] \ ({1, 2} \cap {})), {(-1 % [a |-> 1]) : b1286 \in (2..1 \cup TRUE)}} \cap DOMAIN [[b1287 \in {} |-> b1287] EXCEPT ![CASE FALSE -> 7 [] OTHER -> 3] = (7 % 0)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00781 failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 106 to line 14, col 119 of module random_00781
---*)
