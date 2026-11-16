(*---
description: Evaluates a random int expression, seed 262, number 867.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00867 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-Head(<<>>)) % Cardinality(({1, 2} \ SUBSET {1}))) % (CASE (TRUE \/ 2) -> (-1 % 1) [] OTHER -> (2147483647 - {x \in 1..3 : x > 1}) % LET b1404 == (--1) IN (-1 \div b1404))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 168 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 165.
    | Expression starting at line 14, column 165.
    | Definition starting at line 14, column 156.
    | Let Definitions starting at line 14, column 156.
    | Case Other Arm starting at line 14, column 152.
    | Fatal errors while parsing TLA+ spec in file random_00867
    | In module random_00867
    | Could not parse module random_00867 from file random_00867.tla
    | *** Errors: 1
    | In module random_00867
    | Could not parse module random_00867 from file random_00867.tla
    3002:1 Parsing or semantic analysis failed.
---*)
