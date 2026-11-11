(*---
description: Evaluates a random record expression, seed 262, number 2563.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02563 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (-(-3)), b |-> (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)] EXCEPT !.a = (Head(Tail(<<1, 2>>)) * CASE (\A b4041 \in SUBSET {1} : FALSE) -> ([a |-> 1]).a [] OTHER -> (1 * -1))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 189 to line 14, col 189 of module random_02563 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 187.
    | Expression starting at line 14, column 187.
    | ExtendableExpr starting at line 14, column 186.
    | Expression starting at line 14, column 186.
    | Case Other Arm starting at line 14, column 177.
    | Fatal errors while parsing TLA+ spec in file random_02563
    | In module random_02563
    | Could not parse module random_02563 from file random_02563.tla
    | *** Errors: 1
    | In module random_02563
    | Could not parse module random_02563 from file random_02563.tla
    3002:1 Parsing or semantic analysis failed.
---*)
