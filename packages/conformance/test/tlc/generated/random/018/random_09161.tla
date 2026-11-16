(*---
description: Evaluates a random function expression, seed 262, number 9161.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09161 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14228 \in {((7 * b14229) - Len(<<1, 2>>)) : b14229 \in ((1 - 1) .. (-0))} |-> ((([x \in 1..2 |-> x] @@ <<5, 6>>) @@ [b14230 \in {1} |-> b14228]))[<<Len(<<1, 2>>), IF TRUE THEN b14228 ELSE b14228>>]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09161 failed.
    Attempted to check equality of integer 1 with non-integer:
    <<2, -2>>
---*)
