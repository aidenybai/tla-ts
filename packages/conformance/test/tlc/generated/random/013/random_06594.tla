(*---
description: Evaluates a random record expression, seed 262, number 6594.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06594 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(LET b10118 == Len(<<3, 1, 2>>) IN (b10118 % 3) * Head(Tail(<<>>))) EXCEPT !.a = (([[a |-> 1] EXCEPT !.a = @ + 3]).a < (-(--1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 141 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 138.
    | Expression starting at line 14, column 137.
    | ExtendableExpr starting at line 14, column 136.
    | ExtendableExpr starting at line 14, column 99.
    | Expression starting at line 14, column 99.
    | Fatal errors while parsing TLA+ spec in file random_06594
    | In module random_06594
    | Could not parse module random_06594 from file random_06594.tla
    | *** Errors: 1
    | In module random_06594
    | Could not parse module random_06594 from file random_06594.tla
    3002:1 Parsing or semantic analysis failed.
---*)
