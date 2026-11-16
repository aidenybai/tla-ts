(*---
description: Evaluates a random function expression, seed 262, number 6985.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06985 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([b10696 \in {2, 1, 3} |-> b10696])[(CHOOSE b10697 \in {2, 1, 3} : TRUE)] - ([b10698 \in {1} |-> 2])[(7 * -1)]) :> (CHOOSE r \in [a : 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 122 to line 14, col 122 of module random_06985 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 120.
    | Expression starting at line 14, column 120.
    | ExtendableExpr starting at line 14, column 119.
    | Expression starting at line 14, column 119.
    | Some [] Form starting at line 14, column 118.
    | Fatal errors while parsing TLA+ spec in file random_06985
    | In module random_06985
    | Could not parse module random_06985 from file random_06985.tla
    | *** Errors: 1
    | In module random_06985
    | Could not parse module random_06985 from file random_06985.tla
    3002:1 Parsing or semantic analysis failed.
---*)
