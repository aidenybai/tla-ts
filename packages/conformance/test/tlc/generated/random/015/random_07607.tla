(*---
description: Evaluates a random record expression, seed 262, number 7607.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07607 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> [SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = (2147483647 :> 2)], b |-> (SelectSeq(<<>>, LAMBDA e : e > 0) = [b11701 \in 1..3 |-> 0])] EXCEPT !.a = ([[a |-> 7, b |-> TRUE] EXCEPT !.a = (3 % 2)] * CASE (~TRUE) -> Head(<<3, 1, 2>>) [] OTHER -> (--1))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 273 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 270.
    | Expression starting at line 14, column 270.
    | Case Other Arm starting at line 14, column 261.
    | CASE Expression starting at line 14, column 224.
    | ExtendableExpr starting at line 14, column 177.
    | Fatal errors while parsing TLA+ spec in file random_07607
    | In module random_07607
    | Could not parse module random_07607 from file random_07607.tla
    | *** Errors: 1
    | In module random_07607
    | Could not parse module random_07607 from file random_07607.tla
    3002:1 Parsing or semantic analysis failed.
---*)
