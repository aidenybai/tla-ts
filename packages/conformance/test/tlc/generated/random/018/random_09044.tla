(*---
description: Evaluates a random int expression, seed 262, number 9044.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09044 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(({Len(<<1, 2>>), ([a |-> 1]).a} \ (IF TRUE THEN [a |-> 1, b |-> TRUE] ELSE -1 .. (--1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 112 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 109.
    | ExtendableExpr starting at line 14, column 104.
    | Expression starting at line 14, column 103.
    | IF THEN ELSE starting at line 14, column 63.
    | Expression starting at line 14, column 63.
    | Fatal errors while parsing TLA+ spec in file random_09044
    | In module random_09044
    | Could not parse module random_09044 from file random_09044.tla
    | *** Errors: 1
    | In module random_09044
    | Could not parse module random_09044 from file random_09044.tla
    3002:1 Parsing or semantic analysis failed.
---*)
