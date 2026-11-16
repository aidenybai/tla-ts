(*---
description: Evaluates a random seq expression, seed 262, number 146.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00146 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(SortSeq(SelectSeq(<<5, 6>>, LAMBDA e : e > 0), LAMBDA p, q : p < q)), LET b225 == CASE (\A b226 \in {} : FALSE) -> ([x \in 1..2 |-> x])[2147483647] [] OTHER -> Head(<<1, 2>>) IN (IF TRUE THEN b225 ELSE -1 + (b225 - 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00146 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)
