(*---
description: Evaluates a random record expression, seed 262, number 7507.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07507 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((3 + -1) * (7 % 1)) \div (IF FALSE THEN 7 ELSE 7 + IF TRUE THEN TRUE ELSE 2)), b |-> (\E b11564 \in {(--1), (3 - 7)} : (~(0 => TRUE)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 129 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 126.
    | Expression starting at line 14, column 126.
    | Some { } form starting at line 14, column 125.
    | ExtendableExpr starting at line 14, column 125.
    | Expression starting at line 14, column 125.
    | Fatal errors while parsing TLA+ spec in file random_07507
    | In module random_07507
    | Could not parse module random_07507 from file random_07507.tla
    | *** Errors: 1
    | In module random_07507
    | Could not parse module random_07507 from file random_07507.tla
    3002:1 Parsing or semantic analysis failed.
---*)
