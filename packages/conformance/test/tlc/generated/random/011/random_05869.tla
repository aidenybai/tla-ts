(*---
description: Evaluates a random int expression, seed 262, number 5869.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05869 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SortSeq(SubSeq(Tail(<<1, 2>>), CASE TRUE -> -1 [] OTHER -> 2147483647, (--1)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 94 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 91.
    | Expression starting at line 14, column 91.
    | Optional Arguments starting at line 14, column 34.
    | Primitive expression starting at line 14, column 28.
    | ExtendableExpr starting at line 14, column 28.
    | Fatal errors while parsing TLA+ spec in file random_05869
    | In module random_05869
    | Could not parse module random_05869 from file random_05869.tla
    | *** Errors: 1
    | In module random_05869
    | Could not parse module random_05869 from file random_05869.tla
    3002:1 Parsing or semantic analysis failed.
---*)
