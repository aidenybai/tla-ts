(*---
description: Evaluates a random int expression, seed 262, number 259.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00259 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(DOMAIN [b438 \in {} |-> 2]) * (([b439 \in {1, 2} |-> b439])[CASE FALSE -> 0 [] OTHER -> 0] \div (-(--1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 130 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 127.
    | Expression starting at line 14, column 126.
    | ExtendableExpr starting at line 14, column 125.
    | ExtendableExpr starting at line 14, column 60.
    | Expression starting at line 14, column 60.
    | Fatal errors while parsing TLA+ spec in file random_00259
    | In module random_00259
    | Could not parse module random_00259 from file random_00259.tla
    | *** Errors: 1
    | In module random_00259
    | Could not parse module random_00259 from file random_00259.tla
    3002:1 Parsing or semantic analysis failed.
---*)
