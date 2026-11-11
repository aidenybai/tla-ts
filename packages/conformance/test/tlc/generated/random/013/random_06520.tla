(*---
description: Evaluates a random int expression, seed 262, number 6520.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06520 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((TRUE => <<1>>) < Cardinality(Nat)) => ((2 = 3) /\ (2147483647 < 0))) THEN LET b10019 == [(<<>> % 7) EXCEPT !.a = @ + Len(<<1>>)] IN Cardinality(<<b10019, b10019>>) ELSE [b10020 \in UNION {UNION {Nat, {2, 1, 3}}, ({1} \ {1})} |-> Len((<<>> \o <<1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06520 failed.
    Attempted to evaluate an expression of form P => Q when Q was
    a tuple.
    line 14, col 22 to line 14, col 34 of module random_06520
---*)
