(*---
description: Evaluates a random record expression, seed 262, number 4180.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04180 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = @ + ([b6575 \in UNION {SUBSET {1}, {x \in 1..3 : x > 1}} |-> CASE FALSE -> b6575 [] OTHER -> -1])[LET b6576 == (-1) IN Len(<<>>)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04180 failed.
    Attempted to compare integer 2 with non-integer:
    {}
---*)
