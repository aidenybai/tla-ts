(*---
description: Evaluates a random record expression, seed 262, number 9550.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09550 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((([a |-> 1]).a % (2 + 2147483647)) - IF (FALSE => TRUE) THEN (0 * 1) ELSE CASE FALSE -> -1 [] OTHER -> 2), b |-> (Head(<<3, 1>>) \in UNION {(FALSE \cap SUBSET {1}), (1..3 \cup {1, 2})})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09550 failed.
    2178:0 Overflow when computing 2+2147483647
---*)
