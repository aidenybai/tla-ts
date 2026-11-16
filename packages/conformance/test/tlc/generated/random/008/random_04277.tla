(*---
description: Evaluates a random int expression, seed 262, number 4277.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04277 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]) EXCEPT ![(-1 * <<>>)] = LET b6734 == -1 IN b6734] EXCEPT ![(Head(<<1, 2>>) + IF TRUE THEN 3 ELSE 1)] = (-(--1))])[Len(SelectSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 173 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 170.
    | Expression starting at line 14, column 169.
    | ExtendableExpr starting at line 14, column 168.
    | Expression starting at line 14, column 168.
    | Except Spec starting at line 14, column 122.
    | Fatal errors while parsing TLA+ spec in file random_04277
    | In module random_04277
    | Could not parse module random_04277 from file random_04277.tla
    | *** Errors: 1
    | In module random_04277
    | Could not parse module random_04277 from file random_04277.tla
    3002:1 Parsing or semantic analysis failed.
---*)
