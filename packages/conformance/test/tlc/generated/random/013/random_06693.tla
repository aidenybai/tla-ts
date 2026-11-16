(*---
description: Evaluates a random record expression, seed 262, number 6693.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06693 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = (7 * 2)] EXCEPT !.a = (CHOOSE r \in [a : {}] : TRUE)] EXCEPT !.a = @ + Head(<<(CHOOSE b10264 \in {} : FALSE), (-1 \div -1)>>)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 177 to line 14, col 180 of module random_06693 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 175.
    | Expression starting at line 14, column 174.
    | ExtendableExpr starting at line 14, column 173.
    | Expression starting at line 14, column 173.
    | Some << -- >> or >>_ Form starting at line 14, column 139.
    | Fatal errors while parsing TLA+ spec in file random_06693
    | In module random_06693
    | Could not parse module random_06693 from file random_06693.tla
    | *** Errors: 1
    | In module random_06693
    | Could not parse module random_06693 from file random_06693.tla
    3002:1 Parsing or semantic analysis failed.
---*)
