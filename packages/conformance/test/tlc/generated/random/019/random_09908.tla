(*---
description: Evaluates a random int expression, seed 262, number 9908.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09908 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Append(SubSeq(SubSeq(<<3, 1, 2>>, 2, 2147483647), (--1), (0 + 7)), (([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]))[(1 * 2)])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 74 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 71.
    | Expression starting at line 14, column 71.
    | Optional Arguments starting at line 14, column 34.
    | Primitive expression starting at line 14, column 28.
    | ExtendableExpr starting at line 14, column 28.
    | Fatal errors while parsing TLA+ spec in file random_09908
    | In module random_09908
    | Could not parse module random_09908 from file random_09908.tla
    | *** Errors: 1
    | In module random_09908
    | Could not parse module random_09908 from file random_09908.tla
    3002:1 Parsing or semantic analysis failed.
---*)
