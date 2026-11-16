(*---
description: Evaluates a random function expression, seed 262, number 8053.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08053 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12437 \in ({Len(<<3, 1, 2>>) : b12438 \in (1..3 \cap {2, 1, 3})} \ {(2147483647 - b12439) : b12439 \in (\E b12440 \in SUBSET {1} : FALSE)}) |-> ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b12437] EXCEPT !.a = CASE FALSE -> b12437 [] OTHER -> 0]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08053 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 122 to line 14, col 153 of module random_08053
---*)
