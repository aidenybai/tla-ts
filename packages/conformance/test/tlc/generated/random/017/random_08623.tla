(*---
description: Evaluates a random set expression, seed 262, number 8623.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08623 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {SortSeq([SubSeq(<<>>, 0, 0) EXCEPT ![1] = (2147483647 + 7)], LAMBDA p, q : p < q), (((--1) % CASE FALSE -> 7 [] OTHER -> 2) .. IF (TRUE = 2..1) THEN (2 % 1) ELSE (<<5, 6>>)[-1])})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 111 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 108.
    | Expression starting at line 14, column 108.
    | ExtendableExpr starting at line 14, column 107.
    | Expression starting at line 14, column 107.
    | ExtendableExpr starting at line 14, column 106.
    | Fatal errors while parsing TLA+ spec in file random_08623
    | In module random_08623
    | Could not parse module random_08623 from file random_08623.tla
    | *** Errors: 1
    | In module random_08623
    | Could not parse module random_08623 from file random_08623.tla
    3002:1 Parsing or semantic analysis failed.
---*)
