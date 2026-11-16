(*---
description: Evaluates a random seq expression, seed 262, number 5877.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05877 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(Append(Tail({}), [[x \in Nat |-> x + 1] EXCEPT ![-1] = 2]), (([a |-> 1, b |-> TRUE]).a % Head(<<1>>)), CASE (1 < 3) -> (--1) [] OTHER -> (3 * 3)), Cardinality(((1 \div -1) .. LET b9063 == 0 IN b9063))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 152 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 149.
    | Expression starting at line 14, column 149.
    | Case Arm starting at line 14, column 138.
    | CASE Expression starting at line 14, column 133.
    | Expression starting at line 14, column 133.
    | Fatal errors while parsing TLA+ spec in file random_05877
    | In module random_05877
    | Could not parse module random_05877 from file random_05877.tla
    | *** Errors: 1
    | In module random_05877
    | Could not parse module random_05877 from file random_05877.tla
    3002:1 Parsing or semantic analysis failed.
---*)
