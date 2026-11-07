(*---
description: Evaluates a random function expression, seed 262, number 3681.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03681 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<Len(SortSeq(<<>>, LAMBDA p, q : p < q)), Cardinality(UNION {{1}, {2, 1, 3}})>> :> LET b5814 == IF (1 = 3) THEN (0 % 1) ELSE (--1) IN Tail(Append(<<1>>, 0))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 146 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 143.
    | Expression starting at line 14, column 143.
    | IF THEN ELSE starting at line 14, column 114.
    | Expression starting at line 14, column 114.
    | Definition starting at line 14, column 105.
    | Fatal errors while parsing TLA+ spec in file random_03681
    | In module random_03681
    | Could not parse module random_03681 from file random_03681.tla
    | *** Errors: 1
    | In module random_03681
    | Could not parse module random_03681 from file random_03681.tla
    3002:1 Parsing or semantic analysis failed.
---*)
