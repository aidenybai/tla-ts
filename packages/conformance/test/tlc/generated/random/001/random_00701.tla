(*---
description: Evaluates a random seq expression, seed 262, number 701.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00701 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(SubSeq((<<1>> \o <<3, 1, 2>>), ([x \in 1..2 |-> x])[0], ([a |-> 1, b |-> TRUE]).a), LAMBDA p, q : p < q) EXCEPT ![1] = (\A b1167 \in ({2147483647, -1} \cup {b1168 \in 1..3 : TRUE}) : ((\A b1169 \in {1, 2} : TRUE) <=> (<<1, 2>> = <<5, 6>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00701 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)
