(*---
description: Evaluates a random set expression, seed 262, number 4893.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04893 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((<<1>> \div 7) * (3 \div 1)) - ((<<5, 6>>)[3] \div (2 - 7))), ([[b7613 \in 2..1 |-> b7613] EXCEPT ![([a |-> 1, b |-> TRUE]).a] = (3 * 0)])[CASE (TRUE <=> TRUE) -> Len(<<1, 2>>) [] OTHER -> (1 * -1)]})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 211 to line 14, col 211 of module random_04893 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 209.
    | Expression starting at line 14, column 209.
    | ExtendableExpr starting at line 14, column 208.
    | Expression starting at line 14, column 208.
    | Case Other Arm starting at line 14, column 199.
    | Fatal errors while parsing TLA+ spec in file random_04893
    | In module random_04893
    | Could not parse module random_04893 from file random_04893.tla
    | *** Errors: 1
    | In module random_04893
    | Could not parse module random_04893 from file random_04893.tla
    3002:1 Parsing or semantic analysis failed.
---*)
