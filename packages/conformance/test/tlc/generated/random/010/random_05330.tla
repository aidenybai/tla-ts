(*---
description: Evaluates a random bool expression, seed 262, number 5330.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05330 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq(Tail(<<3, 1, 2>>), LAMBDA p, q : p < q) = ((2147483647 :> 1) @@ [b8243 \in {1} |-> b8243])) \/ (<<(3 \div 3), (--1)>> = ((<<5, 6>>)[1] :> IF FALSE THEN 1 ELSE 3))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 139 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 136.
    | Expression starting at line 14, column 136.
    | Some << -- >> or >>_ Form starting at line 14, column 122.
    | ExtendableExpr starting at line 14, column 122.
    | Expression starting at line 14, column 122.
    | Fatal errors while parsing TLA+ spec in file random_05330
    | In module random_05330
    | Could not parse module random_05330 from file random_05330.tla
    | *** Errors: 1
    | In module random_05330
    | Could not parse module random_05330 from file random_05330.tla
    3002:1 Parsing or semantic analysis failed.
---*)
