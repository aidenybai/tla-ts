(*---
description: Evaluates a random seq expression, seed 262, number 6372.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06372 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(Tail(Append(<<3, 1, 2>>, 0)), Cardinality({7, 2147483647})), CASE (~(2 < 0)) -> Len(CASE TRUE -> 1..3 [] OTHER -> 7) [] OTHER -> ((2 * 7) + (2 % 2147483647)), Cardinality({(--1), (-0)})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 205 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 202.
    | Expression starting at line 14, column 202.
    | Some { } form starting at line 14, column 201.
    | ExtendableExpr starting at line 14, column 201.
    | Expression starting at line 14, column 201.
    | Fatal errors while parsing TLA+ spec in file random_06372
    | In module random_06372
    | Could not parse module random_06372 from file random_06372.tla
    | *** Errors: 1
    | In module random_06372
    | Could not parse module random_06372 from file random_06372.tla
    3002:1 Parsing or semantic analysis failed.
---*)
