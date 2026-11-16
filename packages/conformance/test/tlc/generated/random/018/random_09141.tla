(*---
description: Evaluates a random bool expression, seed 262, number 9141.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09141 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({CASE ({x \in 1..3 : x > 1} \subseteq SUBSET {1}) -> SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) [] OTHER -> Len(<<3, 1, 2>>) : b14196 \in UNION {{7 : b14197 \in {2, 1, 3}}, DOMAIN [x \in 1..2 |-> x]}} \subseteq ((({} \cap {x \in 1..3 : x > 1}) \cap {b14198 \in {x \in 1..3 : x > 1} : FALSE}) \cup UNION {{2, 2}, ({2, 1, 3} \cap {2, 1, 3})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09141 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
