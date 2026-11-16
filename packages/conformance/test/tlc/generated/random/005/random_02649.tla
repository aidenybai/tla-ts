(*---
description: Evaluates a random record expression, seed 262, number 2649.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02649 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(SubSeq(Append(<<>>, 2), (--1), (3 - 1))), b |-> (SubSeq(([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]), ([a |-> 1, b |-> TRUE]).a, (-1 - 2147483647)) = [b4180 \in (2147483647 .. 2147483647) |-> LET b4181 == b4180 IN b4181])])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 54 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 51.
    | Expression starting at line 14, column 51.
    | Optional Arguments starting at line 14, column 33.
    | Primitive expression starting at line 14, column 27.
    | ExtendableExpr starting at line 14, column 27.
    | Fatal errors while parsing TLA+ spec in file random_02649
    | In module random_02649
    | Could not parse module random_02649 from file random_02649.tla
    | *** Errors: 1
    | In module random_02649
    | Could not parse module random_02649 from file random_02649.tla
    3002:1 Parsing or semantic analysis failed.
---*)
