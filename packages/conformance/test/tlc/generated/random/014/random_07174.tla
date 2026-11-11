(*---
description: Evaluates a random seq expression, seed 262, number 7174.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07174 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail(SelectSeq(Append(<<1, 2>>, 2147483647), LAMBDA e : e > 0)), (-CASE (1..3 => TRUE) -> (7 - -1) [] OTHER -> ([a |-> 1, b |-> TRUE]).a), (([a |-> 2147483647, b |-> FALSE]).a \div Len(Tail(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07174 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a set of the form i..j.
    line 14, col 96 to line 14, col 107 of module random_07174
---*)
