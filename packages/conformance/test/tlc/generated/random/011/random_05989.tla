(*---
description: Evaluates a random function expression, seed 262, number 5989.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05989 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9228 \in (([a |-> 0, b |-> FALSE]).a .. (Len(<<3, 1, 2>>) + (--1))) |-> Head(([<<1>> EXCEPT ![1] = -1] \o SortSeq(<<1, 2>>, LAMBDA p, q : p < q)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 81 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 78.
    | ExtendableExpr starting at line 14, column 59.
    | Expression starting at line 14, column 59.
    | ExtendableExpr starting at line 14, column 58.
    | ExtendableExpr starting at line 14, column 28.
    | Fatal errors while parsing TLA+ spec in file random_05989
    | In module random_05989
    | Could not parse module random_05989 from file random_05989.tla
    | *** Errors: 1
    | In module random_05989
    | Could not parse module random_05989 from file random_05989.tla
    3002:1 Parsing or semantic analysis failed.
---*)
